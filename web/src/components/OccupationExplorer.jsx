import * as d3 from 'd3'
import { useState } from 'react'
import AnimatedChart from './AnimatedChart'
import { colors } from '../data/colors'
import { formatNumber } from '../data/story'
import useMeasure from '../hooks/useMeasure'
import explorer from '../../../data/processed/occupation_explorer.json'

const margin = { top: 54, right: 28, bottom: 66, left: 58 }
const mobileMargin = { top: 34, right: 18, bottom: 58, left: 44 }
const gridValues = [0, 0.25, 0.5, 0.75, 1]

function OccupationExplorer() {
  const [ref, bounds] = useMeasure()
  const [hovered, setHovered] = useState(null)
  const width = Math.max(bounds.width || 720, 320)
  const isMobile = width < 640
  const chartMargin = isMobile ? mobileMargin : margin
  const height = isMobile ? 520 : 600
  const innerWidth = width - chartMargin.left - chartMargin.right
  const innerHeight = height - chartMargin.top - chartMargin.bottom
  const x = d3
    .scaleLinear()
    .domain([0, 1])
    .range([chartMargin.left, chartMargin.left + innerWidth])
  const y = d3
    .scaleLinear()
    .domain([0, 1])
    .range([chartMargin.top + innerHeight, chartMargin.top])
  const r = d3
    .scaleSqrt()
    .domain(d3.extent(explorer, (item) => item.national_employment))
    .range(isMobile ? [4, 11] : [5, 18])
  const active = hovered ?? explorer.find((item) => item.soc_code === '51-2092')

  return (
    <AnimatedChart>
      <div ref={ref} className="my-8">
        <div className="relative">
          <svg
            aria-label="Occupation full-automation and augmentation explorer"
            className="block w-full"
            height={height}
            role="img"
            viewBox={`0 0 ${width} ${height}`}
            width={width}
          >
            {gridValues.map((value) => (
              <g key={`x-${value}`}>
                <line
                  stroke={colors.rule}
                  x1={x(value)}
                  x2={x(value)}
                  y1={chartMargin.top}
                  y2={chartMargin.top + innerHeight}
                />
                <text
                  fill={colors.muted}
                  fontFamily="Inter"
                  fontSize="11"
                  textAnchor="middle"
                  x={x(value)}
                  y={height - 32}
                >
                  {value.toFixed(2).replace(/\.00$/, '')}
                </text>
              </g>
            ))}
            {gridValues.map((value) => (
              <g key={`y-${value}`}>
                <line
                  stroke={colors.rule}
                  x1={chartMargin.left}
                  x2={chartMargin.left + innerWidth}
                  y1={y(value)}
                  y2={y(value)}
                />
                <text
                  fill={colors.muted}
                  fontFamily="Inter"
                  fontSize="11"
                  textAnchor="end"
                  x={chartMargin.left - 10}
                  y={y(value) + 4}
                >
                  {value.toFixed(2).replace(/\.00$/, '')}
                </text>
              </g>
            ))}
            {!isMobile ? (
              <>
                <text
                  fill={colors.muted}
                  fontFamily="Inter"
                  fontSize="10"
                  fontWeight="600"
                  letterSpacing="1"
                  x={chartMargin.left + 8}
                  y={chartMargin.top + innerHeight - 12}
                >
                  LOW AUTOMATION, LOW AUGMENTATION
                </text>
                <text
                  fill={colors.muted}
                  fontFamily="Inter"
                  fontSize="10"
                  fontWeight="600"
                  letterSpacing="1"
                  x={chartMargin.left + 8}
                  y={chartMargin.top + 16}
                >
                  LOW AUTOMATION, HIGH AUGMENTATION
                </text>
                <text
                  fill={colors.muted}
                  fontFamily="Inter"
                  fontSize="10"
                  fontWeight="600"
                  letterSpacing="1"
                  textAnchor="end"
                  x={chartMargin.left + innerWidth - 8}
                  y={chartMargin.top + innerHeight - 12}
                >
                  HIGH AUTOMATION, LOW AUGMENTATION
                </text>
                <text
                  fill={colors.muted}
                  fontFamily="Inter"
                  fontSize="10"
                  fontWeight="600"
                  letterSpacing="1"
                  textAnchor="end"
                  x={chartMargin.left + innerWidth - 8}
                  y={chartMargin.top + 16}
                >
                  HIGH AUTOMATION, HIGH AUGMENTATION
                </text>
              </>
            ) : null}
            {explorer.map((occupation) => {
              const isHovered = hovered?.soc_code === occupation.soc_code
              return (
                <circle
                  key={occupation.soc_code}
                  cx={x(occupation.full_automation_score)}
                  cy={y(occupation.augmentation_pathway_score)}
                  fill={colors.accent}
                  fillOpacity="0.72"
                  onPointerEnter={() => setHovered(occupation)}
                  onPointerLeave={() => setHovered(null)}
                  r={r(occupation.national_employment) * (isHovered ? 1.2 : 1)}
                  stroke={colors.accent}
                  strokeWidth={isHovered ? 1.5 : 0.75}
                  style={{ transition: 'r 160ms ease, stroke-width 160ms ease' }}
                />
              )
            })}
            <text
              fill={colors.muted}
              fontFamily="Inter"
              fontSize="12"
              fontWeight="600"
              textAnchor="middle"
              x={chartMargin.left + innerWidth / 2}
              y={height - 8}
            >
              Full-automation threshold clearance
            </text>
            <text
              fill={colors.muted}
              fontFamily="Inter"
              fontSize="12"
              fontWeight="600"
              textAnchor="middle"
              transform={`translate(14 ${chartMargin.top + innerHeight / 2}) rotate(-90)`}
            >
              Augmentation pathway
            </text>
          </svg>
        </div>
        {active ? (
          <div className="mt-6 border-y border-rule py-5 font-sans text-sm leading-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-baseline md:justify-between">
              <h3 className="font-serif text-2xl font-semibold leading-tight text-ink">
                {active.title}
              </h3>
              <p className="shrink-0 text-muted">
                Employment {formatNumber(active.national_employment)}
              </p>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="font-semibold text-accent">
                  Full automation {active.full_automation_score.toFixed(2)}
                </p>
                <p className="mt-1 text-muted">{active.rationale_full}</p>
              </div>
              <div>
                <p className="font-semibold text-accent">
                  Augmentation {active.augmentation_pathway_score.toFixed(2)}
                </p>
                <p className="mt-1 text-muted">{active.rationale_aug}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AnimatedChart>
  )
}

export default OccupationExplorer
