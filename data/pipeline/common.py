from __future__ import annotations

import json
import os
import math
import time
from pathlib import Path
from typing import Iterable

import requests
import pandas as pd


ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
RAW = DATA / "raw"
PROCESSED = DATA / "processed"

BLS_API_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/"
BLS_YEAR = "2024"
OEWS_CURRENT_FILE = RAW / "bls_oews_data_current.tsv"


def ensure_dirs() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    PROCESSED.mkdir(parents=True, exist_ok=True)


def read_json(path: Path, default=None):
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, payload) -> None:
    def clean(value):
        if isinstance(value, dict):
            return {key: clean(item) for key, item in value.items()}
        if isinstance(value, list):
            return [clean(item) for item in value]
        if hasattr(value, "item"):
            return clean(value.item())
        if isinstance(value, float) and not math.isfinite(value):
            return None
        return value

    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(clean(payload), f, indent=2, ensure_ascii=True)
        f.write("\n")


def chunked(items: list[str], size: int) -> Iterable[list[str]]:
    for idx in range(0, len(items), size):
        yield items[idx : idx + size]


def soc_to_occ_code(soc_code: str) -> str:
    return soc_code.replace("-", "")


def occ_code_to_soc(occ_code: str) -> str:
    code = str(occ_code).zfill(6)
    return f"{code[:2]}-{code[2:]}"


def major_group_code(soc_code: str) -> str:
    return f"{soc_code[:2]}-0000"


def bls_series_id(
    areatype_code: str,
    area_code: str,
    occupation_code: str,
    datatype_code: str = "01",
    industry_code: str = "000000",
) -> str:
    area = str(area_code).zfill(7)
    occupation = str(occupation_code).replace("-", "").zfill(6)
    datatype = str(datatype_code).zfill(2)
    return f"OEU{areatype_code}{area}{industry_code}{occupation}{datatype}"


def parse_number(value):
    if value is None:
        return None
    try:
        return float(str(value).replace(",", ""))
    except ValueError:
        return None


def query_bls_series(
    series_ids: list[str],
    cache_path: Path,
    *,
    start_year: str = BLS_YEAR,
    end_year: str = BLS_YEAR,
    chunk_size: int = 50,
    sleep_seconds: float = 0.12,
) -> dict[str, dict | None]:
    """Fetch annual BLS time-series observations with an append-only JSON cache."""
    ensure_dirs()
    cached = read_json(cache_path, default={}) or {}
    wanted = list(dict.fromkeys(series_ids))
    missing = [series_id for series_id in wanted if series_id not in cached]
    if not missing:
        return {series_id: cached.get(series_id) for series_id in wanted}

    api_key = os.environ.get("BLS_API_KEY")
    for part in chunked(missing, chunk_size):
        payload = {
            "seriesid": part,
            "startyear": start_year,
            "endyear": end_year,
        }
        if api_key:
            payload["registrationkey"] = api_key

        for attempt in range(4):
            response = requests.post(
                BLS_API_URL,
                json=payload,
                timeout=60,
                headers={"Content-Type": "application/json"},
            )
            if response.status_code == 200:
                body = response.json()
                if body.get("status") == "REQUEST_SUCCEEDED":
                    break
            if attempt == 3:
                raise RuntimeError(
                    f"BLS API request failed for {len(part)} series: "
                    f"{response.status_code} {response.text[:500]}"
                )
            time.sleep(1.5 * (attempt + 1))

        seen = set()
        for series in body.get("Results", {}).get("series", []):
            series_id = series["seriesID"]
            seen.add(series_id)
            rows = series.get("data", [])
            cached[series_id] = rows[0] if rows else None
        for series_id in part:
            if series_id not in seen:
                cached[series_id] = None

        write_json(cache_path, cached)
        time.sleep(sleep_seconds)

    return {series_id: cached.get(series_id) for series_id in wanted}


def load_oews_current_series(
    series_ids: list[str],
    cache_path: Path,
) -> dict[str, dict | None]:
    """Read selected May 2024 OEWS observations from the public flat file."""
    ensure_dirs()
    cached = read_json(cache_path, default={}) or {}
    wanted = list(dict.fromkeys(series_ids))
    missing = [series_id for series_id in wanted if series_id not in cached]
    if not missing:
        return {series_id: cached.get(series_id) for series_id in wanted}
    if not OEWS_CURRENT_FILE.exists():
        raise FileNotFoundError(
            f"{OEWS_CURRENT_FILE} is missing; run 01_download.py first"
        )

    missing_set = set(missing)
    found: set[str] = set()
    for chunk in pd.read_csv(
        OEWS_CURRENT_FILE,
        sep="\t",
        dtype=str,
        chunksize=750_000,
    ):
        chunk.columns = chunk.columns.str.strip()
        chunk["series_id"] = chunk["series_id"].str.strip()
        mask = (
            chunk["series_id"].isin(missing_set)
            & (chunk["year"] == BLS_YEAR)
            & (chunk["period"] == "A01")
        )
        if not mask.any():
            continue
        for record in chunk.loc[mask].to_dict("records"):
            series_id = record["series_id"]
            cached[series_id] = {
                "year": record["year"],
                "period": record["period"],
                "value": record["value"],
                "footnote_codes": record.get("footnote_codes"),
            }
            found.add(series_id)

    for series_id in missing:
        if series_id not in found:
            cached[series_id] = None

    write_json(cache_path, cached)
    return {series_id: cached.get(series_id) for series_id in wanted}


MAJOR_GROUPS = {
    "11-0000": "Management Occupations",
    "13-0000": "Business and Financial Operations Occupations",
    "15-0000": "Computer and Mathematical Occupations",
    "17-0000": "Architecture and Engineering Occupations",
    "19-0000": "Life, Physical, and Social Science Occupations",
    "21-0000": "Community and Social Service Occupations",
    "23-0000": "Legal Occupations",
    "25-0000": "Educational Instruction and Library Occupations",
    "27-0000": "Arts, Design, Entertainment, Sports, and Media Occupations",
    "29-0000": "Healthcare Practitioners and Technical Occupations",
    "31-0000": "Healthcare Support Occupations",
    "33-0000": "Protective Service Occupations",
    "35-0000": "Food Preparation and Serving Related Occupations",
    "37-0000": "Building and Grounds Cleaning and Maintenance Occupations",
    "39-0000": "Personal Care and Service Occupations",
    "41-0000": "Sales and Related Occupations",
    "43-0000": "Office and Administrative Support Occupations",
    "45-0000": "Farming, Fishing, and Forestry Occupations",
    "47-0000": "Construction and Extraction Occupations",
    "49-0000": "Installation, Maintenance, and Repair Occupations",
    "51-0000": "Production Occupations",
    "53-0000": "Transportation and Material Moving Occupations",
}


PROTOTYPE_OCCUPATIONS = {
    "51-4121": "Welders, Cutters, Solderers, and Brazers",
    "47-2111": "Electricians",
    "47-2152": "Plumbers, Pipefitters, and Steamfitters",
    "49-9021": "Heating, Air Conditioning, and Refrigeration Mechanics and Installers",
    "51-2090": "Miscellaneous Assemblers and Fabricators",
    "51-4041": "Machinists",
    "51-2028": "Electrical, Electronic, and Electromechanical Assemblers",
    "51-9161": "Computer Numerically Controlled Tool Operators",
    "49-3023": "Automotive Service Technicians and Mechanics",
    "49-3011": "Aircraft Mechanics and Service Technicians",
    "35-2021": "Food Preparation Workers",
    "37-2011": "Janitors and Cleaners, Except Maids and Housekeeping Cleaners",
    "53-7062": "Laborers and Freight, Stock, and Material Movers, Hand",
    "53-3033": "Light Truck Drivers",
    "45-2092": "Farmworkers and Laborers, Crop, Nursery, and Greenhouse",
    "47-2061": "Construction Laborers",
    "29-1141": "Registered Nurses",
    "29-1292": "Dental Hygienists",
    "39-5012": "Hairdressers, Hairstylists, and Cosmetologists",
    "33-9032": "Security Guards",
}
