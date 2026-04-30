import AnimatedChart from './AnimatedChart'
import { formatNumber } from '../data/story'
import explorer from '../../../data/processed/occupation_explorer.json'

const scoreSteps = Array.from({ length: 10 }, (_, index) => index + 1)

function tileCount(score) {
  return Math.max(0, Math.min(scoreSteps.length, Math.round(score * scoreSteps.length)))
}

function pathwayLabel(occupation) {
  const full = occupation.full_automation_score
  const augmentation = occupation.augmentation_pathway_score

  if (full >= 0.55 && augmentation >= 0.6) return 'Structured-work frontier'
  if (full < 0.35 && augmentation >= 0.55) return 'Augmentation-led'
  if (full >= 0.55) return 'Automation-specific'
  if (full < 0.25 && augmentation < 0.45) return 'Low near-term exposure'
  return 'Mixed pathway'
}

function ScoreTiles({ label, score, variant }) {
  const count = tileCount(score)
  const filledClass =
    variant === 'automation'
      ? 'border border-accent bg-accent'
      : 'border border-accent bg-accent/30'

  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between gap-3">
        <span className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted">
          {label}
        </span>
        <span className="font-sans text-xs font-semibold tabular-nums text-ink">
          {score.toFixed(2)}
        </span>
      </div>
      <span
        aria-label={`${label} score ${score.toFixed(2)}; ${count} of 10 tiles filled`}
        className="flex items-center gap-[3px]"
        role="img"
      >
        {scoreSteps.map((step) => (
          <span
            key={step}
            aria-hidden="true"
            className={`h-[11px] w-[11px] ${step <= count ? filledClass : 'border border-rule bg-paper'}`}
          />
        ))}
      </span>
    </div>
  )
}

function ScoreLegend() {
  return (
    <div className="grid gap-3 border-b border-rule px-4 py-4 font-sans text-xs leading-5 text-muted md:grid-cols-[1fr_auto] md:items-end md:px-0">
      <p>
        Each row keeps the two-axis prototype, but renders it as score tiles.
        One square is one-tenth of the hand-coded score; the tiles are score
        bins, not audited task counts.
      </p>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <span className="inline-flex items-center gap-2">
          <span className="h-[11px] w-[11px] border border-accent bg-accent" />
          Full automation
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-[11px] w-[11px] border border-accent bg-accent/30" />
          Augmentation
        </span>
      </div>
    </div>
  )
}

function HeaderRow() {
  return (
    <div className="hidden border-b border-rule py-3 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted md:grid md:grid-cols-[minmax(13rem,1.25fr)_7.5rem_minmax(18rem,1.4fr)_7rem] md:gap-5">
      <span>Occupation</span>
      <span>Employment</span>
      <span>Prototype frame</span>
      <span className="text-right">Detail</span>
    </div>
  )
}

function OccupationRow({ occupation, index }) {
  return (
    <details className="group border-b border-rule last:border-b-0" open={index === 0}>
      <summary className="grid min-h-28 cursor-pointer list-none gap-4 px-4 py-5 marker:hidden md:grid-cols-[minmax(13rem,1.25fr)_7.5rem_minmax(18rem,1.4fr)_7rem] md:items-center md:gap-5 md:px-0">
        <div>
          <h3 className="font-serif text-xl font-semibold leading-tight text-ink md:text-2xl">
            {occupation.title}
          </h3>
          <p className="mt-2 font-sans text-xs font-semibold uppercase tracking-[0.1em] text-muted">
            {occupation.soc_code} · {pathwayLabel(occupation)}
          </p>
        </div>
        <p className="font-sans text-sm font-semibold tabular-nums text-accent">
          {formatNumber(occupation.national_employment)}
        </p>
        <div className="grid gap-3">
          <ScoreTiles
            label="Full automation"
            score={occupation.full_automation_score}
            variant="automation"
          />
          <ScoreTiles
            label="Augmentation"
            score={occupation.augmentation_pathway_score}
            variant="augmentation"
          />
        </div>
        <div className="font-sans text-xs font-semibold uppercase tracking-[0.12em] md:text-right">
          <span className="text-accent group-open:hidden">Open</span>
          <span className="hidden text-muted group-open:inline">Close</span>
        </div>
      </summary>
      <div className="grid gap-5 border-t border-rule px-4 pb-7 pt-5 font-sans text-sm leading-6 md:grid-cols-2 md:px-0 md:pl-[calc(13rem+7.5rem+2.5rem)]">
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
        <p className="text-xs leading-5 text-muted md:col-span-2">
          Geographic concentration: {occupation.geographic_concentration.join(', ')}
        </p>
      </div>
    </details>
  )
}

function OccupationExplorer() {
  const occupations = [...explorer].sort(
    (a, b) => b.national_employment - a.national_employment,
  )

  return (
    <AnimatedChart>
      <div className="my-8">
        <ScoreLegend />
        <HeaderRow />
        <div>
          {occupations.map((occupation, index) => (
            <OccupationRow
              key={occupation.soc_code}
              occupation={occupation}
              index={index}
            />
          ))}
        </div>
      </div>
    </AnimatedChart>
  )
}

export default OccupationExplorer
