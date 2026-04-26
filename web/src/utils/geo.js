import occupations from '../../../data/processed/coverage_by_occupation.json'

const occupationTitleBySoc = new Map(
  occupations.map((occupation) => [occupation.soc_code, occupation.title]),
)

export function normalizeSearch(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function countySearchLabel(county) {
  return `${county.county_name}, ${county.state}`
}

export function filterCounties(counties, query, limit = 5) {
  const normalized = normalizeSearch(query)
  if (!normalized) return []
  const terms = normalized.split(' ')

  return counties
    .map((county) => {
      const label = normalizeSearch(
        `${county.county_name} ${county.state} ${county.fips}`,
      )
      const starts = normalizeSearch(countySearchLabel(county)).startsWith(normalized)
      const matches = terms.every((term) => label.includes(term))
      if (!matches) return null
      return { county, score: starts ? 0 : label.indexOf(terms[0]) + 1 }
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score || a.county.county_name.localeCompare(b.county.county_name))
    .slice(0, limit)
    .map((item) => item.county)
}

export function occupationNames(codes) {
  return codes.map((code) => occupationTitleBySoc.get(code) ?? code)
}

export function aggregateStates(counties) {
  const stateMap = new Map()
  for (const county of counties) {
    const stateFips = county.fips.slice(0, 2)
    const current = stateMap.get(stateFips) ?? {
      fips: stateFips,
      state: county.state,
      totalEmployment: 0,
      weightedCoverage: 0,
      weightedPhysical: 0,
    }
    const employment = county.total_employment || 0
    current.totalEmployment += employment
    current.weightedCoverage += county.weighted_coverage_gap * employment
    current.weightedPhysical += county.physical_exposure_index * employment
    stateMap.set(stateFips, current)
  }

  return new Map(
    [...stateMap.entries()].map(([fips, state]) => [
      fips,
      {
        ...state,
        weighted_coverage_gap:
          state.totalEmployment > 0 ? state.weightedCoverage / state.totalEmployment : 0,
        physical_exposure_index:
          state.totalEmployment > 0 ? state.weightedPhysical / state.totalEmployment : 0,
        total_employment: state.totalEmployment,
      },
    ]),
  )
}
