from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import requests

from common import OEWS_CURRENT_FILE, RAW, ensure_dirs, write_json


SOURCES = {
    "anthropic_job_exposure": {
        "url": "https://huggingface.co/datasets/Anthropic/EconomicIndex/resolve/main/labor_market_impacts/job_exposure.csv",
        "path": RAW / "anthropic_job_exposure.csv",
    },
    "anthropic_task_penetration": {
        "url": "https://huggingface.co/datasets/Anthropic/EconomicIndex/resolve/main/labor_market_impacts/task_penetration.csv",
        "path": RAW / "anthropic_task_penetration.csv",
    },
    "anthropic_onet_task_mappings": {
        "url": "https://huggingface.co/datasets/Anthropic/EconomicIndex/resolve/main/release_2025_02_10/onet_task_mappings.csv",
        "path": RAW / "anthropic_onet_task_mappings.csv",
    },
    "anthropic_soc_structure": {
        "url": "https://huggingface.co/datasets/Anthropic/EconomicIndex/resolve/main/release_2025_02_10/SOC_Structure.csv",
        "path": RAW / "anthropic_soc_structure.csv",
    },
    "onet_database": {
        "url": "https://www.onetcenter.org/dl_files/database/db_30_2_text.zip",
        "path": RAW / "onet_db_30_2_text.zip",
    },
    "qcew_annual_singlefile": {
        "url": "https://data.bls.gov/cew/data/files/2024/csv/2024_annual_singlefile.zip",
        "path": RAW / "qcew_2024_annual_singlefile.zip",
    },
    "bls_oews_current_timeseries": {
        "url": "https://downloadt.bls.gov/pub/time.series/oe/oe.data.0.Current",
        "path": OEWS_CURRENT_FILE,
    },
    "nber_cbsa_county_crosswalk": {
        "url": "https://data.nber.org/cbsa-csa-fips-county-crosswalk/2023/cbsa2fipsxw_2023.csv",
        "path": RAW / "cbsa2fipsxw_2023.csv",
    },
    "census_cbsa_gazetteer": {
        "url": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_cbsa_national.zip",
        "path": RAW / "census_2024_cbsa_gazetteer.zip",
    },
    "census_county_gazetteer": {
        "url": "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_counties_national.zip",
        "path": RAW / "census_2024_county_gazetteer.zip",
    },
    "bls_employment_projections_occupation_table": {
        "url": "https://r.jina.ai/http://https://www.bls.gov/emp/tables/occupational-projections-and-characteristics.htm",
        "path": RAW / "bls_ep_occupational_projections_2024_2034.md",
    },
}


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download(url: str, path: Path) -> None:
    if path.exists() and path.stat().st_size > 0:
        print(f"exists {path.relative_to(RAW.parent)}")
        return

    print(f"download {url}")
    with requests.get(url, stream=True, timeout=120) as response:
        response.raise_for_status()
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = path.with_suffix(path.suffix + ".tmp")
        with tmp_path.open("wb") as f:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    f.write(chunk)
        tmp_path.replace(path)


def fetch_huggingface_tree() -> dict:
    url = "https://huggingface.co/api/datasets/Anthropic/EconomicIndex/tree/main?recursive=1&expand=false"
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    files = response.json()
    releases = sorted(
        {
            item["path"].split("/")[0]
            for item in files
            if item.get("path", "").startswith("release_")
        }
    )
    releases_with_onet_mappings = sorted(
        {
            item["path"].split("/")[0]
            for item in files
            if item.get("path", "").endswith("/onet_task_mappings.csv")
        }
    )
    onet_release = releases_with_onet_mappings[-1] if releases_with_onet_mappings else None
    return {
        "dataset": "Anthropic/EconomicIndex",
        "latest_release_directory": releases[-1] if releases else None,
        "latest_release_with_onet_task_mappings": onet_release,
        "release_directories": releases,
        "files_used": [
            "labor_market_impacts/job_exposure.csv",
            "labor_market_impacts/task_penetration.csv",
            f"{onet_release}/onet_task_mappings.csv" if onet_release else None,
            "release_2025_02_10/SOC_Structure.csv",
        ],
    }


def main() -> None:
    ensure_dirs()
    manifest = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "sources": {},
        "anthropic_dataset": fetch_huggingface_tree(),
        "notes": [
            "BLS OEWS national and MSA estimates are fetched through the public BLS API in later steps.",
            "The BLS Employment Projections occupation table is cached as a national employment fallback and cross-check.",
            "The BLS downloadable OEWS zip files can return 403 from some automated environments; the API path is used for reproducibility.",
        ],
    }

    for name, source in SOURCES.items():
        download(source["url"], source["path"])
        manifest["sources"][name] = {
            "url": source["url"],
            "local_path": str(source["path"].relative_to(RAW.parent)),
            "bytes": source["path"].stat().st_size,
            "sha256": file_sha256(source["path"]),
        }

    write_json(RAW / "source_manifest.json", manifest)
    print(json.dumps(manifest["anthropic_dataset"], indent=2))


if __name__ == "__main__":
    main()
