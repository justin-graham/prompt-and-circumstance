# Methodology

This project estimates where Anthropic Economic Index (EI) usage data may under-measure workers whose jobs are primarily physical, mobile, or site-specific.

The goal is additive: Anthropic has been explicit that Claude.ai usage data are not a complete labor-market sampling frame. This analysis quantifies one specific coverage gap and proposes a physical-exposure extension.

## Data Sources

- Anthropic Economic Index: `Anthropic/EconomicIndex`, using `labor_market_impacts/job_exposure.csv` and the latest available O*NET mapping files exposed in the dataset tree.
- BLS OEWS May 2024: public OEWS flat time-series file, `oe.data.0.Current`, for national and MSA occupation employment.
- BLS Employment Projections Table 1.2: used only as a fallback for missing national detail rows.
- O*NET 30.2 bulk database: physical descriptors from `Abilities.txt`.
- BLS QCEW 2024 annual singlefile: county industry employment.
- NBER CBSA-to-FIPS crosswalk and Census 2024 Gazetteer files: geographic joins and county names.

## Occupation Coverage Definition

The pipeline reads `observed_exposure` from the EI `job_exposure.csv` file and treats it as the occupation-level EI representation score.

The default coverage tiers are:

- Low coverage: `observed_exposure < 0.02`
- Medium coverage: `0.02 <= observed_exposure < 0.08`
- High coverage: `observed_exposure >= 0.08`

The headline coverage gap is the employment-weighted share of U.S. workers in low-coverage occupations. With May 2024 OEWS employment, the default estimate is:

| Threshold | Coverage-gap employment | Share of national employment |
| --- | ---: | ---: |
| `observed_exposure < 0.01` | 64,126,752 | 41.59% |
| `observed_exposure < 0.02` | 68,107,489 | 44.17% |
| `observed_exposure < 0.05` | 79,399,354 | 51.50% |

The threshold is intentionally simple. It does not claim that occupations just above 0.02 are fully measured; it marks the part of the occupation distribution with minimal observed EI representation.

The 0.02 cutoff is used because it identifies occupations with only trace observed representation while preserving enough occupations above the threshold to distinguish low, medium, and high coverage groups. The sensitivity table above shows that the headline conclusion is not created by a knife-edge threshold choice: the estimated gap remains 41.59% at a stricter 0.01 cutoff and rises to 51.50% at a broader 0.05 cutoff.

## National Employment Join

EI occupation codes are joined directly to OEWS SOC codes. For each detailed occupation, the pipeline pulls national employment from the OEWS May 2024 flat time-series file.

Some national major-group employment is not represented by matched detailed rows because of SOC aggregation, suppression, or missing detail rows. For the national headline, unmatched employment within a major group is allocated using that major group's observed low-coverage share among matched detailed occupations:

```text
low_share_m = low_coverage_employment_m / matched_detail_employment_m
unmatched_m = max(major_group_employment_m - matched_detail_employment_m, 0)
allocated_low_m = unmatched_m * low_share_m
```

The national coverage-gap employment is:

```text
sum(low_coverage_detail_employment) + sum(allocated_low_m)
```

Under the default threshold, this allocation contributes about 5.48 million of the 68.11 million low-coverage workers.

## MSA Coverage Gap

For each MSA, the pipeline first reads reported OEWS detailed-occupation employment and major-group employment.

Within each major group `m` in MSA `g`:

```text
reported_detail_mg = sum(reported detailed occupation employment in m, g)
reported_low_mg = sum(reported low-coverage detailed occupation employment in m, g)
reported_low_share_mg = reported_low_mg / reported_detail_mg
unmatched_mg = max(reported major-group employment_mg - reported_detail_mg, 0)
```

The low-coverage contribution for that MSA-major group is:

```text
reported_low_mg + unmatched_mg * reported_low_share_mg
```

If an MSA-major group has no reported detailed occupation rows, the national major-group low-coverage share is used as the allocation rate. This preserves the MSA's reported major-group employment while avoiding a zero assumption for suppressed detail rows.

The MSA coverage gap is:

```text
sum(major-group low-coverage contributions) / sum(reported major-group employment)
```

## Allocation Sensitivity

The main Act 2 correlation uses the within-major-group allocation described above. The correlation between MSA coverage gap and physical exposure is `0.772`.

To test whether this result is driven by allocated suppressed rows, the pipeline also recomputes MSA coverage gaps using reported detailed occupation rows only:

```text
reported_detail_only_gap_g = reported_low_detail_employment_g / reported_detail_employment_g
```

This excludes suppressed and unmatched rows from both numerator and denominator. Under that stricter specification, the correlation is `0.795` across the same 393 MSAs. The sign and magnitude therefore do not depend on the allocation step.

This is still a descriptive correlation, not a causal estimate. It says that places with larger EI coverage gaps also tend to have higher physical-exposure proxies; it does not identify why that relationship exists.

## Physical Exposure Proxy

The MSA physical exposure index is an employment-weighted proxy based on major occupation groups with high physical or field-work content:

| Major group | Weight |
| --- | ---: |
| Farming, Fishing, and Forestry | 0.70 |
| Construction and Extraction | 0.85 |
| Installation, Maintenance, and Repair | 0.75 |
| Production | 1.00 |
| Transportation and Material Moving | 0.80 |

All other major groups receive weight `0` in the current proxy. The county-level index uses QCEW physical-industry concentration for localization within and outside MSAs.

This proxy is intentionally transparent rather than final. The proposed fellowship work would replace it with a task-level physical exposure model using O*NET descriptors, robotics capability thresholds, and validation against adoption data.

The coverage gap and physical exposure proxy are conceptually distinct. The coverage gap is measured from EI representation joined to OEWS occupation employment; it asks whether an occupation appears in the Claude.ai usage frame. The physical exposure proxy is built from the local mix of physical major occupation groups and QCEW physical-industry concentration; it asks whether a place has more employment in work settings where robotics, cobots, inspection, teleoperation, and physical automation are plausible channels. Their positive correlation is therefore not mechanical: it is a descriptive empirical relationship between a measurement-coverage variable and an independently constructed physical-work concentration variable.

## Act 3 Robotics Frontier Evidence

The robotics frontier table is generated by `data/pipeline/05_robotics_frontier.py` and written to `data/processed/robotics_frontier.json`. It covers the ten largest low-coverage occupations from the national EI/OEWS join.

Each occupation has two tracks:

- Specialized track: the strongest public evidence for a purpose-built robotic or automated system touching a task slice within that occupation.
- Humanoid track: the strongest public evidence for a general-purpose human-form robot touching that occupation, or an explicit no-deployment note when no credible public effort was identified.

The stage scale is intentionally task-level:

| Stage | Label |
| ---: | --- |
| 1 | Lab demo |
| 2 | Paid pilot |
| 3 | Narrow commercial task |
| 4 | Multi-site operational product |
| 5 | Occupation-level substitution evidence |

No row currently receives Stage 5 because the public evidence supports bounded task slices rather than occupation-level substitution. Each observed track includes `task_coverage`, `claim_supported`, `source_date`, `source_type`, `confidence`, and a `sources[]` list. The confidence label is a source-quality and claim-fit judgment, not a statistical uncertainty interval.

This evidence layer is not a replacement for exposure scoring. It is a source-backed bridge between the coverage gap and the physical-exposure framework: it shows that automation progress is uneven, task-specific, and often better described as augmentation than full occupation automation.

## Act 3 Prototype Scoring

The 20-occupation prototype uses two hand-scored dimensions:

- Full-automation threshold clearance: whether current or near-term robotic systems can reliably perform the constituent physical subtasks end to end.
- Augmentation pathway score: whether cobots, teleoperation, inspection, routing, documentation, or exception-handling systems can materially change the role before full automation clears the threshold.

These scores are research scaffolding, not validated estimates. They are written as falsifiable rationales so that future work can replace them with a reproducible scoring rubric.
