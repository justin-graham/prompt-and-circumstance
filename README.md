# The Invisible Workforce

The Invisible Workforce is an independent public research artifact prepared for an Anthropic Fellows Program application. It extends the Anthropic Economic Index measurement frame by estimating how much U.S. employment sits in occupations with little observed representation in Claude.ai usage data, then asks where that gap is geographically concentrated.

The site is respectful of the Economic Index design: usage data are valuable precisely because they are observed behavior. The contribution here is to quantify one structural limitation and propose a physical-exposure extension for workers whose tasks rarely begin in a chat interface.

## Headline Findings

- May 2024 OEWS national employment: 154,187,380 workers.
- Low-coverage employment at the default EI threshold: 68,107,489 workers.
- Coverage gap: 44.17% of national employment.
- MSA coverage-gap / physical-exposure correlation: 0.772.
- Reported-detail-only sensitivity correlation, excluding allocated MSA rows: 0.795.

## Methodology Summary

Occupation coverage is measured from Anthropic Economic Index `observed_exposure` joined to BLS OEWS May 2024 employment. The default low-coverage threshold is:

```text
observed_exposure < 0.02
```

MSA coverage gaps use reported detailed OEWS occupation rows where available. Suppressed or unmatched employment within each MSA major group is allocated using the reported low-coverage share of that same MSA-major group. If no detailed rows are reported for a major group, the national major-group low-coverage share is used.

County values inherit MSA coverage gaps where possible and use QCEW industry structure to localize variation within metros and outside metro counties. Physical exposure is a transparent proxy based on production, construction, installation and repair, transportation, and farming employment concentration. See [METHODOLOGY.md](METHODOLOGY.md) for formulas and sensitivity analysis.

## Data Sources

- Anthropic Economic Index: `Anthropic/EconomicIndex`.
- BLS Occupational Employment and Wage Statistics, May 2024 flat time-series file.
- BLS Employment Projections Table 1.2 for national fallback rows.
- O*NET 30.2 bulk database for physical descriptors.
- BLS QCEW 2024 annual singlefile for county industry employment.
- NBER CBSA-to-FIPS crosswalk.
- Census 2024 Gazetteer files.
- Public robotics deployment sources listed in `data/pipeline/05_robotics_frontier.py`, including company releases, SEC-adjacent reporting, and reputable robotics or logistics trade coverage.

## Reproduction

Raw source files are downloaded to `data/raw/`, which is gitignored. Processed JSON files are written to `data/processed/` and consumed by the frontend.

```bash
data/pipeline/run_all.sh
```

The pipeline prints the national coverage summary, MSA correlation, top invisible occupations, and writes:

- `data/processed/coverage_by_occupation.json`
- `data/processed/coverage_by_county.json`
- `data/processed/coverage_by_msa.json`
- `data/processed/occupation_explorer.json`
- `data/processed/robotics_frontier.json`
- `data/processed/summary_national.json`
- `data/processed/summary_geography.json`

## Frontend

The website is a static Vite + React app.

```bash
cd web
npm install
npm run dev
npm run build
npm run lint
```

The county map uses `us-atlas` TopoJSON loaded asynchronously after first paint. The app has no backend, user accounts, analytics requirement, social share widgets, or newsletter signup.

## Deployment

The repository is configured for GitHub Pages using the workflow in `.github/workflows/pages.yml`. Pushes to `main` build the Vite app in `web/` and publish `web/dist/` to:

```text
https://justin-graham.github.io/prompt-and-circumstance/
```

## Status

This repository is not an Anthropic product and does not imply Anthropic endorsement. It is an independent research artifact submitted as part of an Anthropic Fellows application.
