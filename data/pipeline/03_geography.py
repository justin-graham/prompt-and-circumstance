from __future__ import annotations

import math
import os
import zipfile

import numpy as np
import pandas as pd

from common import (
    MAJOR_GROUPS,
    PROCESSED,
    RAW,
    bls_series_id,
    load_oews_current_series,
    parse_number,
    query_bls_series,
    read_json,
    soc_to_occ_code,
    write_json,
)


PHYSICAL_MAJOR_WEIGHTS = {
    "45-0000": 0.70,
    "47-0000": 0.85,
    "49-0000": 0.75,
    "51-0000": 1.00,
    "53-0000": 0.80,
}
PHYSICAL_INDUSTRIES = ["11", "21", "23", "31-33", "48-49"]
US_STATE_FIPS = {
    "01",
    "02",
    "04",
    "05",
    "06",
    "08",
    "09",
    "10",
    "11",
    "12",
    "13",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
    "24",
    "25",
    "26",
    "27",
    "28",
    "29",
    "30",
    "31",
    "32",
    "33",
    "34",
    "35",
    "36",
    "37",
    "38",
    "39",
    "40",
    "41",
    "42",
    "44",
    "45",
    "46",
    "47",
    "48",
    "49",
    "50",
    "51",
    "53",
    "54",
    "55",
    "56",
}


def load_major_low_shares() -> dict[str, float]:
    summary = read_json(PROCESSED / "summary_national.json")
    return {
        code: float(values["low_coverage_share"])
        for code, values in summary["major_groups"].items()
    }


def load_top_low_by_major() -> dict[str, list[str]]:
    coverage = pd.read_json(PROCESSED / "coverage_by_occupation.json")
    low = coverage[coverage["coverage_flag"] == "low"].sort_values(
        "national_employment", ascending=False
    )
    output: dict[str, list[str]] = {}
    for major_code in MAJOR_GROUPS:
        output[major_code] = (
            low[low["soc_code"].str.startswith(major_code[:2])]["soc_code"]
            .head(3)
            .tolist()
        )
    return output


def metro_crosswalk() -> pd.DataFrame:
    crosswalk = pd.read_csv(RAW / "cbsa2fipsxw_2023.csv", dtype=str)
    metros = crosswalk[
        crosswalk["metropolitanmicropolitanstatis"] == "Metropolitan Statistical Area"
    ].copy()
    metros["fips"] = metros["fipsstatecode"] + metros["fipscountycode"]
    metros["cbsa"] = metros["cbsacode"].str.zfill(5)
    return metros


def fetch_msa_estimates(metros: pd.DataFrame) -> dict[str, dict | None]:
    coverage = pd.read_json(PROCESSED / "coverage_by_occupation.json")
    detail_codes = sorted(coverage["soc_code"].dropna().astype(str).unique())
    series = []
    for cbsa in sorted(metros["cbsa"].unique()):
        area_code = f"00{cbsa}"
        series.append(bls_series_id("M", area_code, "000000", "01"))
        for major_code in MAJOR_GROUPS:
            series.append(bls_series_id("M", area_code, soc_to_occ_code(major_code), "01"))
        for soc_code in detail_codes:
            series.append(bls_series_id("M", area_code, soc_to_occ_code(soc_code), "01"))
    if os.environ.get("FETCH_MSA_OEWS_API") == "1":
        return query_bls_series(series, RAW / "bls_oews_msa_occupation_2024_api.json")
    print("reading MSA OEWS occupation estimates from the BLS flat time-series file")
    return load_oews_current_series(series, RAW / "bls_oews_flat_msa_occupation_2024.json")


def obs_value(observation: dict | None) -> float:
    if not observation:
        return 0.0
    return float(parse_number(observation.get("value")) or 0.0)


def compute_msa_gap(metros: pd.DataFrame, estimates: dict[str, dict | None]) -> pd.DataFrame:
    low_shares = load_major_low_shares()
    top_low = load_top_low_by_major()
    coverage = pd.read_json(PROCESSED / "coverage_by_occupation.json")
    coverage["occ_code"] = coverage["soc_code"].map(soc_to_occ_code)
    rows = []
    for cbsa, group in metros.groupby("cbsa"):
        area_code = f"00{cbsa}"
        all_emp = obs_value(estimates.get(bls_series_id("M", area_code, "000000", "01")))
        weighted_gap = 0.0
        physical = 0.0
        major_total = 0.0
        reported_detail_total = 0.0
        reported_detail_low = 0.0
        contributions = []

        for major_code in MAJOR_GROUPS:
            major_emp = obs_value(
                estimates.get(
                    bls_series_id("M", area_code, soc_to_occ_code(major_code), "01")
                )
            )
            detail = coverage[coverage["soc_code"].str.startswith(major_code[:2])]
            detail_emp = []
            for item in detail.to_dict("records"):
                emp = obs_value(
                    estimates.get(
                        bls_series_id("M", area_code, item["occ_code"], "01")
                    )
                )
                if emp <= 0:
                    continue
                detail_emp.append((emp, item))
            matched_emp = sum(emp for emp, _ in detail_emp)
            reported_detail_total += matched_emp
            if major_emp <= 0 and matched_emp <= 0:
                continue
            denom_emp = major_emp or matched_emp
            major_total += denom_emp

            low_emp = sum(
                emp for emp, item in detail_emp if item["coverage_flag"] == "low"
            )
            reported_detail_low += low_emp
            matched_low_share = low_emp / matched_emp if matched_emp else low_shares.get(major_code, 0.0)
            unmatched = max(0.0, denom_emp - matched_emp)
            gap_contribution = low_emp + unmatched * matched_low_share
            weighted_gap += gap_contribution
            physical += denom_emp * PHYSICAL_MAJOR_WEIGHTS.get(major_code, 0.0)

            low_details = sorted(
                [
                    (emp, item["soc_code"])
                    for emp, item in detail_emp
                    if item["coverage_flag"] == "low"
                ],
                reverse=True,
            )
            if low_details:
                for emp, soc_code in low_details[:3]:
                    contributions.append((emp, soc_code))
            else:
                contributions.append((gap_contribution, major_code))

        denom = major_total or all_emp
        if denom <= 0:
            continue
        contributions.sort(reverse=True)
        top_codes = []
        for _, code in contributions:
            if code in top_low:
                candidates = top_low.get(code, [])
            else:
                candidates = [code]
            for candidate in candidates:
                if candidate not in top_codes:
                    top_codes.append(candidate)
            if len(top_codes) >= 3:
                break

        rows.append(
            {
                "cbsa": cbsa,
                "msa_name": group["cbsatitle"].iloc[0],
                "total_employment": int(round(all_emp or denom)),
                "weighted_coverage_gap": weighted_gap / denom,
                "weighted_coverage_gap_reported_detail_only": (
                    reported_detail_low / reported_detail_total
                    if reported_detail_total
                    else np.nan
                ),
                "reported_detail_employment": int(round(reported_detail_total)),
                "reported_detail_low_coverage_employment": int(round(reported_detail_low)),
                "physical_exposure_index": physical / denom,
                "top_invisible_occupations": top_codes[:3],
            }
        )

    msa = pd.DataFrame(rows)
    if not msa.empty:
        msa["weighted_coverage_gap"] = msa["weighted_coverage_gap"].clip(0, 1)
        if "weighted_coverage_gap_reported_detail_only" in msa:
            msa["weighted_coverage_gap_reported_detail_only"] = msa[
                "weighted_coverage_gap_reported_detail_only"
            ].clip(0, 1)
        msa["physical_exposure_index"] = msa["physical_exposure_index"].clip(0, 1)
    return msa


def industry_gap_weights() -> dict[str, float]:
    low_shares = load_major_low_shares()
    return {
        "11": low_shares.get("45-0000", 0.0),
        "21": np.mean(
            [
                low_shares.get("47-0000", 0.0),
                low_shares.get("49-0000", 0.0),
                low_shares.get("51-0000", 0.0),
            ]
        ),
        "23": low_shares.get("47-0000", 0.0),
        "31-33": low_shares.get("51-0000", 0.0),
        "48-49": low_shares.get("53-0000", 0.0),
    }


def estimate_gap_from_industries(frame: pd.DataFrame) -> pd.Series:
    summary = read_json(PROCESSED / "summary_national.json")
    baseline = float(summary["coverage_gap_share"])
    weights = industry_gap_weights()
    total = frame["total_employment"].replace(0, np.nan)
    physical_emp = sum(frame.get(f"emp_{code}", 0) for code in PHYSICAL_INDUSTRIES)
    weighted = baseline * (total - physical_emp).clip(lower=0)
    for code, weight in weights.items():
        weighted = weighted + frame.get(f"emp_{code}", 0) * float(weight)
    return (weighted / total).fillna(baseline).clip(0, 1)


def top_codes_from_industries(row: pd.Series) -> list[str]:
    pairs = [
        (row.get("emp_31-33", 0), ["51-2090", "51-4121"]),
        (row.get("emp_23", 0), ["47-2061", "47-2111"]),
        (row.get("emp_48-49", 0), ["53-7062", "53-3033"]),
        (row.get("emp_11", 0), ["45-2092"]),
        (row.get("emp_21", 0), ["49-9021"]),
    ]
    codes = []
    for _, group_codes in sorted(pairs, key=lambda item: item[0], reverse=True):
        for code in group_codes:
            if code not in codes:
                codes.append(code)
        if len(codes) >= 3:
            return codes[:3]
    return ["53-7062", "51-2090", "47-2061"]


def compute_msa_gap_from_qcew(metros: pd.DataFrame, qcew: pd.DataFrame) -> pd.DataFrame:
    metro_counties = metros[["fips", "cbsa", "cbsatitle"]].drop_duplicates()
    merged = metro_counties.merge(qcew, on="fips", how="inner")
    emp_cols = ["total_employment"] + [f"emp_{code}" for code in PHYSICAL_INDUSTRIES]
    grouped = merged.groupby(["cbsa", "cbsatitle"], as_index=False)[emp_cols].sum()
    grouped = grouped[grouped["total_employment"] > 0].copy()
    physical_emp = sum(grouped.get(f"emp_{code}", 0) for code in PHYSICAL_INDUSTRIES)
    grouped["physical_industry_share"] = (
        physical_emp / grouped["total_employment"].replace(0, np.nan)
    ).fillna(0)
    grouped["physical_exposure_index"] = minmax(grouped["physical_industry_share"])
    grouped["weighted_coverage_gap"] = estimate_gap_from_industries(grouped)
    grouped["weighted_coverage_gap_reported_detail_only"] = np.nan
    grouped["reported_detail_employment"] = 0
    grouped["reported_detail_low_coverage_employment"] = 0
    grouped["top_invisible_occupations"] = grouped.apply(top_codes_from_industries, axis=1)
    return grouped.rename(columns={"cbsatitle": "msa_name"})[
        [
            "cbsa",
            "msa_name",
            "total_employment",
            "weighted_coverage_gap",
            "physical_exposure_index",
            "weighted_coverage_gap_reported_detail_only",
            "reported_detail_employment",
            "reported_detail_low_coverage_employment",
            "top_invisible_occupations",
        ]
    ]


def load_county_names() -> pd.DataFrame:
    with zipfile.ZipFile(RAW / "census_2024_county_gazetteer.zip") as archive:
        name = archive.namelist()[0]
        with archive.open(name) as f:
            counties = pd.read_csv(f, sep="\t", dtype=str)
    counties["GEOID"] = counties["GEOID"].str.zfill(5)
    counties = counties[counties["GEOID"].str[:2].isin(US_STATE_FIPS)]
    return counties[["GEOID", "USPS", "NAME"]].rename(
        columns={"GEOID": "fips", "USPS": "state", "NAME": "county_name"}
    )


def load_qcew_county_industry() -> pd.DataFrame:
    needed = {
        "area_fips",
        "own_code",
        "industry_code",
        "year",
        "qtr",
        "annual_avg_emplvl",
    }
    total_chunks = []
    sector_chunks = []
    with zipfile.ZipFile(RAW / "qcew_2024_annual_singlefile.zip") as archive:
        name = archive.namelist()[0]
        with archive.open(name) as f:
            for chunk in pd.read_csv(
                f,
                usecols=list(needed),
                dtype={
                    "area_fips": "string",
                    "own_code": "string",
                    "industry_code": "string",
                    "year": "int16",
                    "qtr": "string",
                    "annual_avg_emplvl": "float64",
                },
                chunksize=500_000,
            ):
                chunk = chunk[
                    (chunk["qtr"] == "A")
                    & (chunk["year"] == 2024)
                    & (chunk["area_fips"].str.len() == 5)
                    & (chunk["area_fips"].str[:2].isin(US_STATE_FIPS))
                    & (~chunk["area_fips"].str.endswith("000"))
                ]
                total_chunks.append(
                    chunk[
                        (chunk["own_code"] == "0")
                        & (chunk["industry_code"] == "10")
                    ]
                )
                sector_chunks.append(
                    chunk[
                        (chunk["own_code"].isin(["1", "2", "3", "5"]))
                        & (chunk["industry_code"].isin(PHYSICAL_INDUSTRIES))
                    ]
                )
    totals = pd.concat(total_chunks, ignore_index=True)
    sectors = pd.concat(sector_chunks, ignore_index=True)
    total_by_county = totals.groupby("area_fips")["annual_avg_emplvl"].sum()
    pivot = sectors.pivot_table(
        index="area_fips",
        columns="industry_code",
        values="annual_avg_emplvl",
        aggfunc="sum",
        fill_value=0,
    )
    index = total_by_county.index.union(pivot.index)
    total = total_by_county.reindex(index, fill_value=0).replace(0, np.nan)
    pivot = pivot.reindex(index, fill_value=0)
    physical = sum(pivot.get(code, 0) for code in PHYSICAL_INDUSTRIES)
    out = pd.DataFrame(
        {
            "fips": index.astype(str),
            "total_employment": total.fillna(0).astype(int).values,
            "physical_industry_share": (physical / total).fillna(0).clip(0, 1).values,
        }
    )
    for code in PHYSICAL_INDUSTRIES:
        out[f"emp_{code}"] = pivot.get(code, pd.Series(0, index=pivot.index)).astype(float).values
    return out


def minmax(series: pd.Series) -> pd.Series:
    lower = float(series.quantile(0.02))
    upper = float(series.quantile(0.98))
    if upper <= lower:
        return pd.Series(0.0, index=series.index)
    return ((series - lower) / (upper - lower)).clip(0, 1)


def compute_county_output(
    msa: pd.DataFrame, metros: pd.DataFrame, qcew: pd.DataFrame | None = None
) -> pd.DataFrame:
    counties = load_county_names()
    if qcew is None:
        qcew = load_qcew_county_industry()
    county = counties.merge(qcew, on="fips", how="left")
    county["total_employment"] = county["total_employment"].fillna(0).astype(int)
    county["physical_industry_share"] = county["physical_industry_share"].fillna(0)
    for code in PHYSICAL_INDUSTRIES:
        column = f"emp_{code}"
        if column not in county:
            county[column] = 0.0
        county[column] = county[column].fillna(0.0)
    county["physical_exposure_index"] = minmax(county["physical_industry_share"])

    metro_assignments = metros[["fips", "cbsa"]].drop_duplicates()
    county = county.merge(metro_assignments, on="fips", how="left")
    county = county.merge(
        msa[["cbsa", "weighted_coverage_gap", "top_invisible_occupations"]],
        on="cbsa",
        how="left",
    )

    industry_gap = estimate_gap_from_industries(county)
    county["weighted_coverage_gap"] = county["weighted_coverage_gap"].fillna(industry_gap)
    county["weighted_coverage_gap"] = (
        0.78 * county["weighted_coverage_gap"] + 0.22 * industry_gap
    ).clip(0, 1)

    fallback_top = ["53-7062", "51-2090", "47-2061"]
    county["top_invisible_occupations"] = county["top_invisible_occupations"].apply(
        lambda value: value if isinstance(value, list) and value else fallback_top
    )

    return county[
        [
            "fips",
            "county_name",
            "state",
            "total_employment",
            "weighted_coverage_gap",
            "physical_exposure_index",
            "top_invisible_occupations",
        ]
    ].copy()


def main() -> None:
    metros = metro_crosswalk()
    qcew = load_qcew_county_industry()
    estimates = fetch_msa_estimates(metros)
    msa = compute_msa_gap(metros, estimates)
    if msa.empty:
        msa = compute_msa_gap_from_qcew(metros, qcew)
    county = compute_county_output(msa, metros, qcew)

    msa_records = []
    for record in msa.sort_values("weighted_coverage_gap", ascending=False).to_dict("records"):
        msa_records.append(
            {
                "cbsa": record["cbsa"],
                "msa_name": record["msa_name"],
                "total_employment": int(record["total_employment"]),
                "weighted_coverage_gap": round(float(record["weighted_coverage_gap"]), 4),
                "physical_exposure_index": round(float(record["physical_exposure_index"]), 4),
                "top_invisible_occupations": record["top_invisible_occupations"],
            }
        )

    county_records = []
    for record in county.sort_values("fips").to_dict("records"):
        county_records.append(
            {
                "fips": record["fips"],
                "county_name": record["county_name"],
                "state": record["state"],
                "total_employment": int(record["total_employment"]),
                "weighted_coverage_gap": round(float(record["weighted_coverage_gap"]), 4),
                "physical_exposure_index": round(float(record["physical_exposure_index"]), 4),
                "top_invisible_occupations": record["top_invisible_occupations"],
            }
        )

    corr = float(
        msa[["weighted_coverage_gap", "physical_exposure_index"]]
        .dropna()
        .corr()
        .iloc[0, 1]
    )
    reported = msa[
        (msa.get("reported_detail_employment", 0) > 0)
        & msa["weighted_coverage_gap_reported_detail_only"].notna()
    ]
    reported_corr = (
        float(
            reported[
                ["weighted_coverage_gap_reported_detail_only", "physical_exposure_index"]
            ]
            .corr()
            .iloc[0, 1]
        )
        if len(reported) > 1
        else None
    )
    geo_summary = {
        "msa_count": int(len(msa)),
        "county_count": int(len(county)),
        "msa_gap_physical_exposure_correlation": round(corr, 6),
        "reported_detail_only": {
            "msa_count": int(len(reported)),
            "correlation": round(reported_corr, 6) if reported_corr is not None else None,
            "definition": "MSA coverage gap recomputed from reported detailed OEWS occupation rows only; suppressed and unmatched rows are excluded from numerator and denominator.",
        },
        "highest_gap_msas": msa_records[:10],
    }

    write_json(PROCESSED / "coverage_by_msa.json", msa_records)
    write_json(PROCESSED / "coverage_by_county.json", county_records)
    write_json(PROCESSED / "summary_geography.json", geo_summary)

    print("Geography summary")
    print(f"  MSA count with OEWS major-group data: {geo_summary['msa_count']:,}")
    print(f"  county records: {geo_summary['county_count']:,}")
    print(
        "  MSA coverage gap / physical exposure correlation: "
        f"{geo_summary['msa_gap_physical_exposure_correlation']:.3f}"
    )
    if geo_summary["reported_detail_only"]["correlation"] is not None:
        print(
            "  reported-detail-only correlation: "
            f"{geo_summary['reported_detail_only']['correlation']:.3f}"
        )
    print("  highest-gap MSAs:")
    for item in geo_summary["highest_gap_msas"][:10]:
        print(
            f"    {item['cbsa']} {item['msa_name']}: "
            f"gap={item['weighted_coverage_gap']:.1%}, "
            f"physical={item['physical_exposure_index']:.1%}"
        )


if __name__ == "__main__":
    main()
