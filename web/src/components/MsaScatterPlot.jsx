import * as d3 from 'd3'
import { useMemo, useState } from 'react'
import AnimatedChart from './AnimatedChart'
import { colors } from '../data/colors'
import { formatNumber, formatPercent, story } from '../data/story'
import msas from '../../../data/processed/coverage_by_msa.json'
import useMeasure from '../hooks/useMeasure'

const margin = { top: 28, right: 26, bottom: 64, left: 56 }

function regression(data) {
  const meanX = d3.mean(data, (item) => item.weighted_coverage_gap)
  const meanY = d3.mean(data, (item) => item.physical_exposure_index)
  const numerator = d3.sum(
    data,
    (item) =>
      (item.weighted_coverage_gap - meanX) *
      (item.physical_exposure_index - meanY),
  )
  const denominator = d3.sum(
    data,
    (item) => (item.weighted_coverage_gap - meanX) ** 2,
  )
  const slope = numerator / denominator
  const intercept = meanY - slope * meanX
  return { slope, intercept }
}

function MsaScatterPlot() {
  const [ref, bounds] = useMeasure()
  const [hovered, setHovered] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const width = Math.max(bounds.width || 720, 320)
  const height = width < 640 ? 430 : 540
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const data = msas
  const xDomain = d3.extent(data, (item) => item.weighted_coverage_gap)
  const yDomain = d3.extent(data, (item) => item.physical_exposure_index)
  const x = d3
    .scaleLinear()
    .domain([Math.max(0, xDomain[0] - 0.02), Math.min(1, xDomain[1] + 0.02)])
    .range([margin.left, margin.left + innerWidth])
  const y = d3
    .scaleLinear()
    .domain([Math.max(0, yDomain[0] - 0.03), Math.min(1, yDomain[1] + 0.05)])
    .range([margin.top + innerHeight, margin.top])
  const r = d3
    .scaleSqrt()
    .domain(d3.extent(data, (item) => item.total_employment))
    .range(width < 640 ? [2, 8] : [2.5, 12])

  const fit = useMemo(() => regression(data), [data])
  const regressionLine = [
    x.domain()[0],
    x.domain()[1],
  ].map((xValue) => ({
    x: xValue,
    y: fit.intercept + fit.slope * xValue,
  }))

  const xTicks = x.ticks(width < 640 ? 4 : 6)
  const yTicks = y.ticks(5)

  return (
    <AnimatedChart>
      <div ref={ref} className="relative my-12">
        <svg
          aria-label="MSA coverage gap and physical exposure scatter plot"
          className="block w-full"
          height={height}
          role="img"
          viewBox={`0 0 ${width} ${height}`}
          width={width}
        >
          {xTicks.map((tick) => (
            <g key={`x-${tick}`}>
              <line
                stroke={colors.rule}
                x1={x(tick)}
                x2={x(tick)}
                y1={margin.top}
                y2={margin.top + innerHeight}
              />
              <text
                fill={colors.muted}
                fontFamily="Inter"
                fontSize="11"
                textAnchor="middle"
                x={x(tick)}
                y={height - 34}
              >
                {formatPercent(tick, 0)}
              </text>
            </g>
          ))}
          {yTicks.map((tick) => (
            <g key={`y-${tick}`}>
              <line
                stroke={colors.rule}
                x1={margin.left}
                x2={margin.left + innerWidth}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text
                fill={colors.muted}
                fontFamily="Inter"
                fontSize="11"
                textAnchor="end"
                x={margin.left - 10}
                y={y(tick) + 4}
              >
                {formatPercent(tick, 0)}
              </text>
            </g>
          ))}
          <line
            stroke={colors.accent}
            strokeOpacity="0.7"
            strokeWidth="1.5"
            x1={x(regressionLine[0].x)}
            x2={x(regressionLine[1].x)}
            y1={y(regressionLine[0].y)}
            y2={y(regressionLine[1].y)}
          />
          <text
            fill={colors.accent}
            fontFamily="Inter"
            fontSize="12"
            fontWeight="600"
            x={x(regressionLine[1].x) - 82}
            y={y(regressionLine[1].y) - 10}
          >
            r = {story.metrics.correlation.toFixed(3)}
          </text>
          {data.map((item) => (
            <circle
              key={item.cbsa}
              cx={x(item.weighted_coverage_gap)}
              cy={y(item.physical_exposure_index)}
              fill={colors.accent}
              fillOpacity="0.6"
              onPointerEnter={(event) => {
                setHovered(item.cbsa)
                setTooltip({ item, x: event.clientX, y: event.clientY })
              }}
              onPointerLeave={() => {
                setHovered(null)
                setTooltip(null)
              }}
              onPointerMove={(event) => {
                setTooltip({ item, x: event.clientX, y: event.clientY })
              }}
              r={r(item.total_employment)}
              stroke={colors.accent}
              strokeOpacity={hovered === item.cbsa ? 1 : 0.9}
              strokeWidth={hovered === item.cbsa ? 1.5 : 0.8}
            />
          ))}
          <text
            fill={colors.muted}
            fontFamily="Inter"
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
            x={margin.left + innerWidth / 2}
            y={height - 8}
          >
            MSA coverage gap
          </text>
          <text
            fill={colors.muted}
            fontFamily="Inter"
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
            transform={`translate(14 ${margin.top + innerHeight / 2}) rotate(-90)`}
          >
            Physical exposure proxy
          </text>
        </svg>
        {tooltip ? (
          <div
            className="pointer-events-none fixed z-50 max-w-64 border border-rule bg-paper px-3 py-2 font-sans text-xs leading-5 text-ink"
            style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
          >
            <p className="font-semibold">{tooltip.item.msa_name}</p>
            <p className="text-muted">
              Gap {formatPercent(tooltip.item.weighted_coverage_gap)} · Physical{' '}
              {formatPercent(tooltip.item.physical_exposure_index)}
            </p>
            <p className="text-muted">
              Employment {formatNumber(tooltip.item.total_employment)}
            </p>
          </div>
        ) : null}
      </div>
    </AnimatedChart>
  )
}

export default MsaScatterPlot
