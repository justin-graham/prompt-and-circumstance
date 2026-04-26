from __future__ import annotations

import math
import os
import re
import zipfile

import numpy as np
import pandas as pd

from common import (
    MAJOR_GROUPS,
    PROCESSED,
    PROTOTYPE_OCCUPATIONS,
    RAW,
    bls_series_id,
    major_group_code,
    load_oews_current_series,
    parse_number,
    query_bls_series,
    soc_to_occ_code,
    write_json,
)


LOW_THRESHOLD = 0.02
HIGH_THRESHOLD = 0.08
SENSITIVITY_LOW_THRESHOLDS = [0.01, LOW_THRESHOLD, 0.05]
PHYSICAL_ELEMENTS = {
    "Manual Dexterity",
    "Finger Dexterity",
    "Static Strength",
    "Dynamic Flexibility",
}


def coverage_flag(score: float) -> str:
    if score < LOW_THRESHOLD:
        return "low"
    if score < HIGH_THRESHOLD:
        return "medium"
    return "high"


def load_anthropic_exposure() -> pd.DataFrame:
    exposure = pd.read_csv(RAW / "anthropic_job_exposure.csv")
    exposure = exposure.rename(
        columns={
            "occ_code": "soc_code",
            "observed_exposure": "ei_representation_score",
        }
    )
    exposure["soc_code"] = exposure["soc_code"].astype(str)
    exposure["title"] = exposure["title"].astype(str)
    exposure["ei_representation_score"] = pd.to_numeric(
        exposure["ei_representation_score"], errors="coerce"
    ).fillna(0.0)

    extras = pd.DataFrame(
        [
            {
                "soc_code": code,
                "title": title,
                "ei_representation_score": 0.0,
            }
            for code, title in PROTOTYPE_OCCUPATIONS.items()
            if code not in set(exposure["soc_code"])
        ]
    )
    if not extras.empty:
        exposure = pd.concat([exposure, extras], ignore_index=True)

    return exposure.drop_duplicates("soc_code", keep="first")


def fetch_national_bls(soc_codes: list[str]) -> tuple[dict[str, dict | None], dict[str, dict | None]]:
    employment_series = [
        bls_series_id("N", "0000000", soc_to_occ_code(code), "01") for code in soc_codes
    ]
    wage_series = [
        bls_series_id("N", "0000000", soc_to_occ_code(code), "13") for code in soc_codes
    ]
    major_series = [
        bls_series_id("N", "0000000", soc_to_occ_code(code), "01")
        for code in MAJOR_GROUPS
    ]
    all_workers = bls_series_id("N", "0000000", "000000", "01")

    employment = query_bls_series(
        employment_series + major_series + [all_workers],
        RAW / "bls_oews_national_employment_2024.json",
    )
    if os.environ.get("BLS_API_KEY") or os.environ.get("FETCH_MEDIAN_WAGES") == "1":
        wages = query_bls_series(
            wage_series,
            RAW / "bls_oews_national_median_wage_2024.json",
        )
    else:
        wages = {}
    return employment, wages


def fetch_national_oews_flat(
    soc_codes: list[str],
) -> tuple[dict[str, dict | None], dict[str, dict | None]]:
    employment_series = [
        bls_series_id("N", "0000000", soc_to_occ_code(code), "01") for code in soc_codes
    ]
    wage_series = [
        bls_series_id("N", "0000000", soc_to_occ_code(code), "13") for code in soc_codes
    ]
    major_series = [
        bls_series_id("N", "0000000", soc_to_occ_code(code), "01")
        for code in MAJOR_GROUPS
    ]
    all_workers = bls_series_id("N", "0000000", "000000", "01")
    employment = load_oews_current_series(
        employment_series + major_series + [all_workers],
        RAW / "bls_oews_flat_national_employment_2024.json",
    )
    wages = load_oews_current_series(
        wage_series,
        RAW / "bls_oews_flat_national_median_wage_2024.json",
    )
    return employment, wages


def load_ep_employment() -> pd.DataFrame:
    """Parse BLS Employment Projections Table 1.2 from the cached markdown table."""
    path = RAW / "bls_ep_occupational_projections_2024_2034.md"
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) < 12 or cells[1] == "---":
            continue
        soc_code = cells[1]
        if not re.fullmatch(r"\d{2}-\d{4}", soc_code):
            continue
        employment_thousands = parse_number(cells[3])
        if employment_thousands is None:
            continue
        median_wage = parse_number(cells[11])
        median_wage_int = None
        if median_wage is not None and math.isfinite(float(median_wage)):
            median_wage_int = int(round(median_wage))
        rows.append(
            {
                "soc_code": soc_code,
                "title_ep": cells[0],
                "occupation_type": cells[2],
                "national_employment_ep": int(round(employment_thousands * 1000)),
                "median_wage_ep": median_wage_int,
            }
        )
    if not rows:
        raise RuntimeError(f"No BLS EP rows parsed from {path}")
    return pd.DataFrame(rows).drop_duplicates("soc_code", keep="first")


def load_physical_demand_scores() -> pd.DataFrame:
    rows = []
    with zipfile.ZipFile(RAW / "onet_db_30_2_text.zip") as archive:
        with archive.open("db_30_2_text/Abilities.txt") as f:
            abilities = pd.read_csv(f, sep="\t")

    physical = abilities[
        (abilities["Scale ID"] == "LV")
        & (abilities["Element Name"].isin(PHYSICAL_ELEMENTS))
    ].copy()
    physical["soc_code"] = physical["O*NET-SOC Code"].str.slice(0, 7)
    physical["Data Value"] = pd.to_numeric(physical["Data Value"], errors="coerce")
    physical["normalized"] = physical["Data Value"].clip(lower=0, upper=7) / 7.0

    for soc_code, group in physical.groupby("soc_code"):
        rows.append(
            {
                "soc_code": soc_code,
                "physical_demand_score": round(float(group["normalized"].mean()), 4),
            }
        )
    return pd.DataFrame(rows)


def value_from_observation(observation: dict | None) -> float | None:
    if not observation:
        return None
    return parse_number(observation.get("value"))


def optional_int(value) -> int | None:
    if value is None:
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(number):
        return None
    return int(round(number))


def national_gap_for_threshold(
    coverage: pd.DataFrame,
    major_summaries: dict[str, dict],
    threshold: float,
    national_total: float,
) -> dict:
    low_mask = coverage["ei_representation_score"] < threshold
    low_detail = float(coverage.loc[low_mask, "national_employment"].sum())
    allocated_low = 0.0
    major_low_shares = {}

    for major_code, summary in major_summaries.items():
        group = coverage[coverage["soc_code"].str.startswith(major_code[:2])]
        matched_emp = float(group["national_employment"].sum())
        low_emp = float(
            group.loc[group["ei_representation_score"] < threshold, "national_employment"].sum()
        )
        low_share = low_emp / matched_emp if matched_emp else 0.0
        unmatched = max(
            0.0,
            float(summary["national_employment"])
            - float(summary["matched_detail_employment"]),
        )
        allocated_low += unmatched * low_share
        major_low_shares[major_code] = round(low_share, 6)

    total = low_detail + allocated_low
    return {
        "low_threshold": threshold,
        "coverage_gap_employment": int(round(total)),
        "coverage_gap_share": round(total / float(national_total), 6),
        "low_coverage_detail_employment": int(round(low_detail)),
        "allocated_unmatched_low_coverage_employment": int(round(allocated_low)),
        "major_group_low_shares": major_low_shares,
    }


def main() -> None:
    exposure = load_anthropic_exposure()
    ep = load_ep_employment()
    ep_by_soc = ep.set_index("soc_code").to_dict("index")
    use_api = os.environ.get("USE_BLS_OEWS_API") == "1"
    use_flat = not use_api
    if use_api:
        employment, wages = fetch_national_bls(exposure["soc_code"].tolist())
        employment_source = "BLS OEWS May 2024 public API."
    elif use_flat:
        employment, wages = fetch_national_oews_flat(exposure["soc_code"].tolist())
        employment_source = (
            "BLS OEWS May 2024 flat time-series file, with BLS Employment "
            "Projections Table 1.2 used only for missing detail rows."
        )
    else:
        employment, wages = {}, {}
        employment_source = "BLS Employment Projections Table 1.2 fallback."
    physical = load_physical_demand_scores()

    records = []
    for row in exposure.to_dict("records"):
        soc_code = row["soc_code"]
        occ_code = soc_to_occ_code(soc_code)
        ep_row = ep_by_soc.get(soc_code, {})
        emp = ep_row.get("national_employment_ep")
        median_wage = ep_row.get("median_wage_ep")
        if use_api or use_flat:
            emp = value_from_observation(
                employment.get(bls_series_id("N", "0000000", occ_code, "01"))
            ) or emp
            median_wage = value_from_observation(
                wages.get(bls_series_id("N", "0000000", occ_code, "13"))
            ) or median_wage
        if emp is None or emp <= 0:
            continue

        score = float(row["ei_representation_score"])
        records.append(
            {
                "soc_code": soc_code,
                "title": row["title"],
                "national_employment": int(round(emp)),
                "median_wage": optional_int(median_wage),
                "ei_representation_score": round(score, 4),
                "coverage_flag": coverage_flag(score),
                "physical_demand_score": None,
            }
        )

    coverage = pd.DataFrame(records)
    coverage = coverage.merge(physical, on="soc_code", how="left", suffixes=("", "_onet"))
    coverage["physical_demand_score"] = coverage["physical_demand_score_onet"].combine_first(
        coverage["physical_demand_score"]
    )
    coverage = coverage.drop(columns=["physical_demand_score_onet"])
    coverage = coverage.sort_values("national_employment", ascending=False)

    for column in ["national_employment", "median_wage"]:
        coverage[column] = coverage[column].where(pd.notna(coverage[column]), None)
    coverage["physical_demand_score"] = coverage["physical_demand_score"].where(
        pd.notna(coverage["physical_demand_score"]), None
    )

    coverage_records = coverage.to_dict("records")
    for record in coverage_records:
        if isinstance(record["physical_demand_score"], float) and math.isnan(
            record["physical_demand_score"]
        ):
            record["physical_demand_score"] = None

    write_json(PROCESSED / "coverage_by_occupation.json", coverage_records)

    national_total = ep_by_soc.get("00-0000", {}).get("national_employment_ep")
    if use_api or use_flat:
        national_total = value_from_observation(
            employment.get(bls_series_id("N", "0000000", "000000", "01"))
        ) or national_total
    if not national_total:
        national_total = float(coverage["national_employment"].sum())

    major_summaries = {}
    for major_code, major_title in MAJOR_GROUPS.items():
        major_emp = ep_by_soc.get(major_code, {}).get("national_employment_ep")
        if use_api or use_flat:
            major_emp = value_from_observation(
                employment.get(
                    bls_series_id("N", "0000000", soc_to_occ_code(major_code), "01")
                )
            ) or major_emp
        group = coverage[coverage["soc_code"].str.startswith(major_code[:2])]
        matched_emp = float(group["national_employment"].sum())
        low_emp = float(
            group.loc[group["coverage_flag"] == "low", "national_employment"].sum()
        )
        low_share = low_emp / matched_emp if matched_emp else 0.0
        major_summaries[major_code] = {
            "title": major_title,
            "national_employment": int(round(major_emp)) if major_emp else 0,
            "matched_detail_employment": int(round(matched_emp)),
            "low_coverage_share": round(low_share, 6),
        }

    low_detail = float(
        coverage.loc[coverage["coverage_flag"] == "low", "national_employment"].sum()
    )
    allocated_low = 0.0
    for major_code, summary in major_summaries.items():
        unmatched = max(
            0.0,
            float(summary["national_employment"])
            - float(summary["matched_detail_employment"]),
        )
        allocated_low += unmatched * float(summary["low_coverage_share"])

    low_total = low_detail + allocated_low
    threshold_sensitivity = [
        national_gap_for_threshold(
            coverage,
            major_summaries,
            threshold,
            float(national_total),
        )
        for threshold in SENSITIVITY_LOW_THRESHOLDS
    ]
    top_invisible = (
        coverage[coverage["coverage_flag"] == "low"]
        .sort_values("national_employment", ascending=False)
        .head(10)[["soc_code", "title", "national_employment", "ei_representation_score"]]
        .to_dict("records")
    )
    coverage_tiers = []
    for flag in ["low", "medium", "high"]:
        employment = float(
            coverage.loc[coverage["coverage_flag"] == flag, "national_employment"].sum()
        )
        coverage_tiers.append(
            {
                "flag": flag,
                "employment": int(round(employment)),
                "share": round(employment / float(national_total), 6),
            }
        )
    matched_tier_employment = sum(item["employment"] for item in coverage_tiers)
    unmatched_employment = max(0, int(round(national_total)) - matched_tier_employment)
    coverage_tiers.append(
        {
            "flag": "unmatched",
            "employment": unmatched_employment,
            "share": round(unmatched_employment / float(national_total), 6),
        }
    )

    summary = {
        "thresholds": {
            "low": LOW_THRESHOLD,
            "high": HIGH_THRESHOLD,
            "definition": "Low coverage means observed Anthropic EI occupation exposure below 0.02.",
        },
        "employment_source": employment_source,
        "national_total_employment": int(round(national_total)),
        "matched_detail_employment": int(round(coverage["national_employment"].sum())),
        "low_coverage_detail_employment": int(round(low_detail)),
        "allocated_unmatched_low_coverage_employment": int(round(allocated_low)),
        "coverage_gap_employment": int(round(low_total)),
        "coverage_gap_share": round(low_total / float(national_total), 6),
        "coverage_tiers": coverage_tiers,
        "threshold_sensitivity": threshold_sensitivity,
        "major_groups": major_summaries,
        "top_10_invisible_occupations": top_invisible,
    }
    write_json(PROCESSED / "summary_national.json", summary)

    print("National coverage summary")
    print(f"  total employment: {summary['national_total_employment']:,}")
    print(f"  matched detail employment: {summary['matched_detail_employment']:,}")
    print(f"  low-coverage employment: {summary['coverage_gap_employment']:,}")
    print(f"  coverage gap share: {summary['coverage_gap_share']:.2%}")
    print("  top invisible occupations:")
    for item in top_invisible:
        print(
            f"    {item['soc_code']} {item['title']}: "
            f"{item['national_employment']:,}"
        )


if __name__ == "__main__":
    main()
