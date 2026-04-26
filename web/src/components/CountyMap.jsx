import * as d3 from 'd3'
import { useEffect, useMemo, useState } from 'react'
import AnimatedChart from './AnimatedChart'
import { colors } from '../data/colors'
import { formatNumber, formatPercent } from '../data/story'
import counties from '../../../data/processed/coverage_by_county.json'
import useMeasure from '../hooks/useMeasure'
import useMediaQuery from '../hooks/useMediaQuery'
import { aggregateStates, countySearchLabel, filterCounties, occupationNames } from '../utils/geo'
import { topojsonFeatureCollection } from '../utils/topojson'

const mapColors = [0.08, 0.28, 0.46, 0.66, 0.9].map((value) =>
  d3.interpolateRgb(colors.paper, colors.accent)(value),
)

function useAtlas() {
  const [atlas, setAtlas] = useState(null)

  useEffect(() => {
    let active = true
    import('us-atlas/counties-10m.json').then((module) => {
      if (!active) return
      const topology = module.default ?? module
      setAtlas({
        counties: topojsonFeatureCollection(topology, 'counties'),
        states: topojsonFeatureCollection(topology, 'states'),
      })
    })
    return () => {
      active = false
    }
  }, [])

  return atlas
}

function Tooltip({ tooltip }) {
  if (!tooltip) return null

  return (
    <div
      className="pointer-events-none fixed z-50 max-w-64 border border-rule bg-paper px-3 py-2 font-sans text-xs leading-5 text-ink"
      style={{
        left: tooltip.x + 14,
        top: tooltip.y + 14,
      }}
    >
      <p className="font-semibold">{tooltip.title}</p>
      <p className="text-muted">
        Gap {formatPercent(tooltip.coverage)} · Physical {formatPercent(tooltip.physical)}
      </p>
      <p className="text-muted">Employment {formatNumber(tooltip.employment)}</p>
    </div>
  )
}

function SearchResult({ county, onClear }) {
  if (!county) return null

  return (
    <div className="mt-5 border-y border-rule py-6" data-county-result>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-serif text-3xl font-semibold leading-tight text-ink">
            {countySearchLabel(county)}
          </p>
          <button
            className="mt-3 min-h-11 font-sans text-sm font-medium text-accent underline decoration-rule underline-offset-4"
            type="button"
            onClick={onClear}
          >
            Clear selection
          </button>
        </div>
        <div className="grid gap-4 font-sans text-sm md:grid-cols-3 md:text-right">
          <div>
            <p className="font-semibold tabular-nums text-ink">
              {formatNumber(county.total_employment)}
            </p>
            <p className="text-muted">employment</p>
          </div>
          <div>
            <p className="font-semibold tabular-nums text-accent">
              {formatPercent(county.weighted_coverage_gap)}
            </p>
            <p className="text-muted">coverage gap</p>
          </div>
          <div>
            <p className="font-semibold tabular-nums text-accent">
              {formatPercent(county.physical_exposure_index)}
            </p>
            <p className="text-muted">physical exposure</p>
          </div>
        </div>
      </div>
      <div className="mt-6 font-sans text-sm leading-6">
        <p className="font-semibold text-ink">Top invisible occupations</p>
        <ol className="mt-2 grid gap-2 text-muted md:grid-cols-3">
          {occupationNames(county.top_invisible_occupations).map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function CountyMap() {
  const atlas = useAtlas()
  const isMobile = useMediaQuery('(max-width: 639px)')
  const [containerRef, bounds] = useMeasure()
  const [hoveredId, setHoveredId] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const [query, setQuery] = useState('')
  const [selectedCounty, setSelectedCounty] = useState(null)
  const [focused, setFocused] = useState(false)

  const countyByFips = useMemo(
    () => new Map(counties.map((county) => [county.fips, county])),
    [],
  )
  const stateByFips = useMemo(() => aggregateStates(counties), [])
  const matches = useMemo(() => filterCounties(counties, query, 5), [query])

  const width = Math.max(bounds.width || 960, 320)
  const height = isMobile ? Math.max(300, width * 0.82) : Math.min(720, width * 0.58)

  const projection = useMemo(() => {
    if (!atlas) return null
    const features = isMobile ? atlas.states : atlas.counties
    return d3.geoAlbersUsa().fitSize([width, height], features)
  }, [atlas, height, isMobile, width])

  const path = useMemo(() => (projection ? d3.geoPath(projection) : null), [projection])
  const values = useMemo(() => {
    if (isMobile) {
      return [...stateByFips.values()].map((state) => state.weighted_coverage_gap)
    }
    return counties.map((county) => county.weighted_coverage_gap)
  }, [isMobile, stateByFips])

  const colorScale = useMemo(
    () => d3.scaleQuantile(values, mapColors),
    [values],
  )

  const selectedFeature = useMemo(() => {
    if (!atlas || !selectedCounty) return null
    return atlas.counties.features.find((feature) => feature.id === selectedCounty.fips)
  }, [atlas, selectedCounty])

  function selectCounty(county) {
    setSelectedCounty(county)
    setQuery(countySearchLabel(county))
    setFocused(false)
  }

  function showCountyTooltip(event, county) {
    if (!county) return
    setTooltip({
      x: event.clientX,
      y: event.clientY,
      title: countySearchLabel(county),
      coverage: county.weighted_coverage_gap,
      physical: county.physical_exposure_index,
      employment: county.total_employment,
    })
  }

  function showStateTooltip(event, feature) {
    const state = stateByFips.get(String(feature.id).padStart(2, '0'))
    if (!state) return
    setTooltip({
      x: event.clientX,
      y: event.clientY,
      title: feature.properties.name,
      coverage: state.weighted_coverage_gap,
      physical: state.physical_exposure_index,
      employment: state.total_employment,
    })
  }

  const renderFeatures = isMobile ? atlas?.states.features : atlas?.counties.features

  return (
    <AnimatedChart>
      <div className="relative left-1/2 my-14 w-screen -translate-x-1/2 border-y border-rule bg-rule/20 px-4 py-8 md:px-8 md:py-10">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-7 font-sans">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-accent">
              County coverage gap
            </p>
            <p className="mt-2 max-w-[720px] text-sm leading-6 text-muted">
              County estimates inherit reported MSA occupation gaps where
              available, then use QCEW industry structure to localize variation
              within metros and outside metro counties.
            </p>
          </div>
          <div ref={containerRef}>
            <div className="relative">
              {!atlas || !path ? (
                <div className="flex h-80 items-center justify-center border border-rule bg-paper font-sans text-sm text-muted">
                  Loading map geometry
                </div>
              ) : (
                <svg
                  aria-label="County coverage gap choropleth"
                  className="block w-full bg-paper"
                  height={height}
                  role="img"
                  viewBox={`0 0 ${width} ${height}`}
                  width={width}
                >
                  <g>
                    {renderFeatures.map((feature) => {
                      const id = String(feature.id).padStart(isMobile ? 2 : 5, '0')
                      const datum = isMobile ? stateByFips.get(id) : countyByFips.get(id)
                      const isSelected = selectedCounty
                        ? isMobile
                          ? selectedCounty.fips.slice(0, 2) === id
                          : selectedCounty.fips === id
                        : false
                      const isHovered = hoveredId === id
                      return (
                        <path
                          key={id}
                          d={path(feature) ?? undefined}
                          fill={datum ? colorScale(datum.weighted_coverage_gap) : colors.rule}
                          onPointerEnter={(event) => {
                            setHoveredId(id)
                            if (isMobile) showStateTooltip(event, feature)
                            else showCountyTooltip(event, datum)
                          }}
                          onPointerLeave={() => {
                            setHoveredId(null)
                            setTooltip(null)
                          }}
                          onPointerMove={(event) => {
                            if (isMobile) showStateTooltip(event, feature)
                            else showCountyTooltip(event, datum)
                          }}
                          stroke={isSelected || isHovered ? colors.accent : 'transparent'}
                          strokeLinejoin="round"
                          strokeWidth={isSelected || isHovered ? 1.5 : 0}
                          style={{ transition: 'stroke-width 180ms ease, stroke 180ms ease' }}
                        />
                      )
                    })}
                    {isMobile && selectedFeature ? (
                      <path
                        d={path(selectedFeature) ?? undefined}
                        fill="none"
                        pointerEvents="none"
                        stroke={colors.accent}
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                      />
                    ) : null}
                  </g>
                </svg>
              )}
              <Tooltip tooltip={tooltip} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 font-sans text-xs text-muted">
            {mapColors.map((color, index) => (
              <span key={color} className="flex items-center gap-2">
                <span
                  className="h-3 w-6 border border-rule"
                  style={{ backgroundColor: color }}
                />
                {index === 0 ? 'lower gap' : index === mapColors.length - 1 ? 'higher gap' : ''}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[720px] px-6">
        <div className="relative mx-auto max-w-[620px]">
          <label className="sr-only" htmlFor="county-search">
            Look up your county
          </label>
          <input
            id="county-search"
            className="min-h-14 w-full border border-rule bg-paper px-5 py-4 font-serif text-xl text-ink outline-none transition-colors focus:border-accent"
            onChange={(event) => {
              setQuery(event.target.value)
              setFocused(true)
              if (!event.target.value) setSelectedCounty(null)
            }}
            onFocus={() => setFocused(true)}
            placeholder="Look up your county"
            value={query}
          />
          {focused && matches.length > 0 ? (
            <div className="absolute left-0 right-0 top-full z-40 border-x border-b border-rule bg-paper">
              {matches.map((county) => (
                <button
                  key={county.fips}
                  className="block min-h-11 w-full px-5 py-3 text-left font-sans text-sm text-ink hover:bg-rule/30 focus:bg-rule/30 focus:outline-none"
                  data-county-match
                  onMouseDown={(event) => {
                    event.preventDefault()
                    selectCounty(county)
                  }}
                  onClick={() => selectCounty(county)}
                  type="button"
                >
                  {countySearchLabel(county)}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <SearchResult
          county={selectedCounty}
          onClear={() => {
            setSelectedCounty(null)
            setQuery('')
            setFocused(false)
          }}
        />
      </div>
    </AnimatedChart>
  )
}

export default CountyMap
