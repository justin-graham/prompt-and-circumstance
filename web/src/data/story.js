import geography from '../../../data/processed/summary_geography.json'
import national from '../../../data/processed/summary_national.json'

const numberFormatter = new Intl.NumberFormat('en-US')

export function formatNumber(value) {
  return numberFormatter.format(Math.round(value))
}

export function formatPercent(value, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`
}

export function formatMillions(value, digits = 1) {
  return `${(value / 1_000_000).toFixed(digits)}M`
}

export const story = {
  national,
  geography,
  metrics: {
    gapShare: national.coverage_gap_share,
    gapEmployment: national.coverage_gap_employment,
    totalEmployment: national.national_total_employment,
    correlation: geography.msa_gap_physical_exposure_correlation,
    reportedOnlyCorrelation: geography.reported_detail_only?.correlation,
  },
  topMissing: national.top_10_invisible_occupations,
  topMsas: geography.highest_gap_msas,
  coverageTiers: national.coverage_tiers,
}
