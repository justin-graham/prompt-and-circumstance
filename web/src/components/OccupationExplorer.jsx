import * as d3 from 'd3'
import { useMemo, useState } from 'react'
import AnimatedChart from './AnimatedChart'
import { formatMillions, formatNumber } from '../data/story'
import useMeasure from '../hooks/useMeasure'
import explorer from '../../../data/processed/occupation_explorer.json'

const scoreSteps = Array.from({ length: 10 }, (_, index) => index + 1)

const pathways = {
  structured: {
    label: 'Structured automation frontier',
    short: 'Structured',
    className: 'border-accent bg-accent text-paper',
    meterClassName: 'border-accent bg-paper/90',
    textClassName: 'text-paper',
    description: 'Large, repeatable work envelopes where full-task automation is most plausible.',
  },
  augmentation: {
    label: 'Augmentation-led exposure',
    short: 'Augmentation-led',
    className: 'border-accent bg-accent/20 text-ink',
    meterClassName: 'border-accent bg-accent',
    textClassName: 'text-ink',
    description: 'Robots and tools can move the production function before they can own the job.',
  },
  mixed: {
    label: 'Task-specific physical exposure',
    short: 'Task-specific',
    className: 'border-rule bg-rule/50 text-ink',
    meterClassName: 'border-accent bg-accent',
    textClassName: 'text-ink',
    description: 'Some task slices are exposed, but the occupation still depends on judgment or variation.',
  },
  low: {
    label: 'Low near-term physical exposure',
    short: 'Low exposure',
    className: 'border-rule bg-paper text-muted',
    meterClassName: 'border-accent bg-accent',
    textClassName: 'text-muted',
    description: 'Current systems do not clear enough safety, dexterity, trust, or setting thresholds.',
  },
}

const pathwayOrder = ['structured', 'augmentation', 'mixed', 'low']

const thresholdLabels = [
  'Environment',
  'Dexterity',
  'Mobility',
  'Perception',
  'Safety',
  'Exceptions',
  'Human trust',
]

const thresholdProfiles = {
  '51-4121': {
    binding: 'Field variability and workpiece setup',
    states: ['augmentation', 'cleared', 'binding', 'augmentation', 'augmentation', 'binding', 'cleared'],
  },
  '47-2111': {
    binding: 'Live systems, code constraints, and diagnostic ambiguity',
    states: ['binding', 'augmentation', 'augmentation', 'augmentation', 'binding', 'binding', 'augmentation'],
  },
  '47-2152': {
    binding: 'Wet, cramped, custom repair environments',
    states: ['binding', 'binding', 'augmentation', 'augmentation', 'augmentation', 'binding', 'augmentation'],
  },
  '49-9021': {
    binding: 'Varied sites, old equipment, and fault isolation',
    states: ['binding', 'augmentation', 'binding', 'augmentation', 'binding', 'binding', 'augmentation'],
  },
  '51-2092': {
    binding: 'Variant handling and exception recovery',
    states: ['cleared', 'augmentation', 'cleared', 'augmentation', 'augmentation', 'binding', 'cleared'],
  },
  '51-4041': {
    binding: 'Setup judgment and process drift',
    states: ['cleared', 'augmentation', 'cleared', 'augmentation', 'augmentation', 'binding', 'cleared'],
  },
  '51-2028': {
    binding: 'Flexible-part routing and intermittent defects',
    states: ['cleared', 'binding', 'cleared', 'augmentation', 'augmentation', 'binding', 'cleared'],
  },
  '51-9161': {
    binding: 'Setup changes and abnormal-stop recovery',
    states: ['cleared', 'augmentation', 'cleared', 'augmentation', 'augmentation', 'augmentation', 'cleared'],
  },
  '49-3023': {
    binding: 'Open-ended repair diagnosis across vehicle histories',
    states: ['binding', 'binding', 'augmentation', 'augmentation', 'binding', 'binding', 'augmentation'],
  },
  '49-3011': {
    binding: 'Certification-critical inspection and liability',
    states: ['augmentation', 'binding', 'augmentation', 'augmentation', 'binding', 'binding', 'binding'],
  },
  '35-2021': {
    binding: 'Kitchen variation, hygiene, and rush-hour exceptions',
    states: ['augmentation', 'augmentation', 'cleared', 'augmentation', 'binding', 'binding', 'augmentation'],
  },
  '37-2011': {
    binding: 'Unstructured spaces and ambiguous cleanliness standards',
    states: ['binding', 'augmentation', 'augmentation', 'augmentation', 'augmentation', 'binding', 'augmentation'],
  },
  '53-7062': {
    binding: 'Mixed-case handling outside engineered warehouses',
    states: ['cleared', 'augmentation', 'cleared', 'augmentation', 'augmentation', 'augmentation', 'cleared'],
  },
  '53-3033': {
    binding: 'Road edge cases and customer handoff',
    states: ['binding', 'augmentation', 'binding', 'augmentation', 'binding', 'binding', 'augmentation'],
  },
  '45-2092': {
    binding: 'Crop variation, occlusion, and damage tolerance',
    states: ['binding', 'augmentation', 'cleared', 'augmentation', 'augmentation', 'binding', 'cleared'],
  },
  '47-2061': {
    binding: 'Dynamic jobsites, sequencing, and safety coordination',
    states: ['binding', 'augmentation', 'binding', 'augmentation', 'binding', 'binding', 'augmentation'],
  },
  '29-1141': {
    binding: 'Clinical judgment, liability, and patient trust',
    states: ['augmentation', 'augmentation', 'augmentation', 'augmentation', 'binding', 'binding', 'binding'],
  },
  '29-1292': {
    binding: 'Fine manipulation inside a patient mouth',
    states: ['cleared', 'binding', 'cleared', 'augmentation', 'binding', 'binding', 'binding'],
  },
  '39-5012': {
    binding: 'Aesthetic judgment, deformable hair, and client preference',
    states: ['cleared', 'binding', 'cleared', 'augmentation', 'augmentation', 'binding', 'binding'],
  },
  '33-9032': {
    binding: 'Authority, judgment, and rare high-stakes exceptions',
    states: ['augmentation', 'cleared', 'cleared', 'cleared', 'binding', 'binding', 'binding'],
  },
}

const thresholdStateStyles = {
  cleared: {
    label: 'mostly cleared',
    className: 'border-accent bg-accent text-paper',
  },
  augmentation: {
    label: 'augmentation path',
    className: 'border-accent bg-accent/20 text-ink',
  },
  binding: {
    label: 'binding constraint',
    className: 'border-rule bg-paper text-muted',
  },
}

function scoreTileCount(score) {
  return Math.max(0, Math.min(scoreSteps.length, Math.round(score * scoreSteps.length)))
}

function pathwayKey(occupation) {
  const full = occupation.full_automation_score
  const augmentation = occupation.augmentation_pathway_score

  if (full >= 0.55 && augmentation >= 0.6) return 'structured'
  if (full < 0.4 && augmentation >= 0.5) return 'augmentation'
  if (full < 0.25 && augmentation <= 0.45) return 'low'
  return 'mixed'
}

function shortTitle(title) {
  return title
    .replace(', Except Maids and Housekeeping Cleaners', '')
    .replace('Heating, Air Conditioning, and Refrigeration Mechanics and Installers', 'HVAC Mechanics')
    .replace('Laborers and Freight, Stock, and Material Movers, Hand', 'Freight and Stock Movers')
    .replace('Hairdressers, Hairstylists, and Cosmetologists', 'Hairdressers')
    .replace('Computer Numerically Controlled Tool Operators', 'CNC Tool Operators')
}

function buildTreemapData(width, height) {
  const children = pathwayOrder
    .map((key) => ({
      key,
      name: pathways[key].label,
      children: explorer
        .filter((occupation) => pathwayKey(occupation) === key)
        .sort((a, b) => b.national_employment - a.national_employment)
        .map((occupation) => ({
          ...occupation,
          key: occupation.soc_code,
          pathway: key,
        })),
    }))
    .filter((group) => group.children.length)

  const root = d3
    .hierarchy({ name: 'Physical exposure prototype', children })
    .sum((node) => node.national_employment ?? 0)
    .sort((a, b) => b.value - a.value)

  return d3
    .treemap()
    .size([width, height])
    .tile(d3.treemapSquarify.ratio(1.25))
    .paddingOuter(1)
    .paddingInner(4)
    .paddingTop(30)
    .round(true)(root)
}

function MiniMeter({ score, label, light = false }) {
  const count = scoreTileCount(score)
  const emptyClass = light ? 'border-paper/60 bg-paper/20' : 'border-rule bg-paper'
  const filledClass = light ? 'border-paper bg-paper' : 'border-accent bg-accent'

  return (
    <span
      aria-label={`${label} score ${score.toFixed(2)}; ${count} of 10 markers filled`}
      className="flex items-center gap-[2px]"
      role="img"
    >
      {scoreSteps.map((step) => (
        <span
          key={step}
          aria-hidden="true"
          className={`h-[7px] w-[7px] border ${step <= count ? filledClass : emptyClass}`}
        />
      ))}
    </span>
  )
}

function PathwayLegend() {
  return (
    <div className="mb-5 grid gap-3 border-b border-rule pb-5 font-sans text-xs leading-5 text-muted md:grid-cols-2">
      {pathwayOrder.map((key) => (
        <div key={key} className="flex gap-3">
          <span className={`mt-1 h-3 w-3 shrink-0 border ${pathways[key].className}`} />
          <p>
            <span className="font-semibold text-ink">{pathways[key].label}:</span>{' '}
            {pathways[key].description}
          </p>
        </div>
      ))}
    </div>
  )
}

function TreemapTile({ node, active, onSelect }) {
  const occupation = node.data
  const pathway = pathways[occupation.pathway]
  const width = node.x1 - node.x0
  const height = node.y1 - node.y0
  const roomy = width > 150 && height > 92
  const compact = width > 95 && height > 58
  const selected = active.soc_code === occupation.soc_code
  const light = occupation.pathway === 'structured'

  return (
    <button
      aria-label={`${occupation.title}, ${formatNumber(occupation.national_employment)} workers, ${pathway.label}`}
      className={`absolute overflow-hidden border p-2 text-left transition-[outline,transform] duration-150 hover:outline hover:outline-2 hover:outline-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${pathway.className} ${selected ? 'outline outline-2 outline-accent outline-offset-2' : ''}`}
      onClick={() => onSelect(occupation)}
      onFocus={() => onSelect(occupation)}
      onPointerEnter={() => onSelect(occupation)}
      style={{
        left: node.x0,
        top: node.y0,
        width,
        height,
      }}
      type="button"
    >
      {compact ? (
        <>
          <p className={`font-serif text-sm font-semibold leading-tight ${pathway.textClassName}`}>
            {shortTitle(occupation.title)}
          </p>
          {roomy ? (
            <>
              <p className={`mt-2 font-sans text-xs tabular-nums ${light ? 'text-paper' : 'text-muted'}`}>
                {formatMillions(occupation.national_employment)}
              </p>
              <div className="mt-3 grid gap-1">
                <MiniMeter
                  label="Full automation"
                  light={light}
                  score={occupation.full_automation_score}
                />
                <MiniMeter
                  label="Augmentation"
                  light={light}
                  score={occupation.augmentation_pathway_score}
                />
              </div>
            </>
          ) : null}
        </>
      ) : (
        <span className={`font-sans text-[0.65rem] font-semibold ${pathway.textClassName}`}>
          {formatMillions(occupation.national_employment)}
        </span>
      )}
    </button>
  )
}

function GroupLabels({ groups }) {
  return (
    <>
      {groups.map((group) => {
        const width = group.x1 - group.x0
        if (width < 120) return null

        return (
          <div
            key={group.data.key}
            className="pointer-events-none absolute truncate px-2 pt-2 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-muted"
            style={{
              left: group.x0,
              top: group.y0,
              width,
            }}
          >
            {pathways[group.data.key].short}
          </div>
        )
      })}
    </>
  )
}

function ThresholdStrip({ occupation }) {
  const profile = thresholdProfiles[occupation.soc_code]

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2 font-sans text-xs text-muted">
        {Object.entries(thresholdStateStyles).map(([key, value]) => (
          <span key={key} className="inline-flex items-center gap-2">
            <span className={`h-3 w-3 border ${value.className}`} />
            {value.label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-7">
        {thresholdLabels.map((label, index) => {
          const state = profile.states[index]
          return (
            <div
              key={label}
              className={`min-h-16 border px-2 py-2 font-sans text-[0.68rem] font-semibold uppercase leading-4 tracking-[0.08em] ${thresholdStateStyles[state].className}`}
            >
              {label}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DetailPanel({ occupation }) {
  const pathway = pathways[pathwayKey(occupation)]
  const profile = thresholdProfiles[occupation.soc_code]

  return (
    <div className="mt-6 border-y border-rule bg-paper py-6">
      <div className="grid gap-6 md:grid-cols-[1fr_16rem] md:items-start">
        <div>
          <p className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-accent">
            Selected occupation
          </p>
          <h3 className="mt-2 font-serif text-3xl font-semibold leading-tight text-ink md:text-4xl">
            {occupation.title}
          </h3>
          <p className="mt-3 max-w-[42rem] font-sans text-sm leading-6 text-muted">
            {pathway.label}. Binding constraint: {profile.binding}.
          </p>
        </div>
        <div className="grid gap-3 font-sans text-sm">
          <div>
            <p className="text-muted">Employment</p>
            <p className="font-semibold tabular-nums text-accent">
              {formatNumber(occupation.national_employment)}
            </p>
          </div>
          <div>
            <p className="text-muted">Scores</p>
            <p className="font-semibold tabular-nums text-ink">
              {occupation.full_automation_score.toFixed(2)} full automation /{' '}
              {occupation.augmentation_pathway_score.toFixed(2)} augmentation
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ThresholdStrip occupation={occupation} />
      </div>

      <div className="mt-6 grid gap-5 font-sans text-sm leading-6 md:grid-cols-2">
        <div>
          <p className="font-semibold text-accent">
            Full-automation threshold clearance
          </p>
          <p className="mt-1 text-muted">{occupation.rationale_full}</p>
        </div>
        <div>
          <p className="font-semibold text-accent">
            Partial-augmentation pathway
          </p>
          <p className="mt-1 text-muted">{occupation.rationale_aug}</p>
        </div>
      </div>
      <p className="mt-5 font-sans text-xs leading-5 text-muted">
        Geographic concentration: {occupation.geographic_concentration.join(', ')}
      </p>
    </div>
  )
}

function OccupationExplorer() {
  const [ref, bounds] = useMeasure()
  const defaultOccupation = useMemo(
    () => [...explorer].sort((a, b) => b.national_employment - a.national_employment)[0],
    [],
  )
  const [active, setActive] = useState(defaultOccupation)
  const width = Math.max(bounds.width || 960, 320)
  const isMobile = width < 640
  const height = isMobile ? 660 : Math.max(560, Math.min(720, width * 0.56))

  const treemap = useMemo(() => buildTreemapData(width, height), [height, width])
  const groups = treemap.children ?? []
  const leaves = treemap.leaves()

  return (
    <AnimatedChart>
      <div ref={ref} className="mx-auto my-8 max-w-[1180px]">
        <PathwayLegend />
        <div className="flex flex-wrap gap-5 font-sans text-xs text-muted">
          <div className="flex gap-5">
            <span className="inline-flex items-center gap-2">
              <span className="h-[7px] w-[7px] border border-accent bg-accent" />
              Full automation
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-[7px] w-[7px] border border-accent bg-paper" />
              Augmentation
            </span>
          </div>
        </div>
        <div
          aria-label="Employment-weighted physical exposure treemap"
          className="relative mt-5 border border-rule bg-paper"
          role="img"
          style={{ height }}
        >
          <GroupLabels groups={groups} />
          {leaves.map((node) => (
            <TreemapTile
              key={node.data.soc_code}
              active={active}
              node={node}
              onSelect={setActive}
            />
          ))}
        </div>
        <DetailPanel occupation={active} />
      </div>
    </AnimatedChart>
  )
}

export default OccupationExplorer
