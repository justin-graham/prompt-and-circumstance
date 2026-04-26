#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

python3 -m pip install -r data/pipeline/requirements.txt
python3 data/pipeline/01_download.py
python3 data/pipeline/02_join.py
python3 data/pipeline/03_geography.py
python3 data/pipeline/04_occupations.py

python3 - <<'PY'
import json
from pathlib import Path

processed = Path("data/processed")
national = json.loads((processed / "summary_national.json").read_text())
geo = json.loads((processed / "summary_geography.json").read_text())

print("\nCHECKPOINT SUMMARY")
print(f"Total national employment: {national['national_total_employment']:,}")
print(f"Employment in low-coverage occupations: {national['coverage_gap_employment']:,}")
print(f"Coverage gap percentage: {national['coverage_gap_share']:.2%}")
correlation = geo["msa_gap_physical_exposure_correlation"]
correlation_text = "n/a" if correlation is None else f"{correlation:.3f}"
print(
    "MSA coverage gap / physical exposure correlation: "
    f"{correlation_text}"
)
print("Top 10 invisible occupations:")
for item in national["top_10_invisible_occupations"]:
    print(f"  {item['soc_code']} {item['title']}: {item['national_employment']:,}")
PY
