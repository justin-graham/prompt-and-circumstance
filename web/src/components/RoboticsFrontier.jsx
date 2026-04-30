import { formatMillions } from '../data/story'
import frontier from '../../../data/processed/robotics_frontier.json'

const stageLabels = {
  1: 'Lab demo',
  2: 'Pilot deployment',
  3: 'Limited commercial',
  4: 'Broad commercial',
  5: 'Labor displacement at scale',
}

function StagePill({ stage }) {
  return (
    <span
      aria-label={`Stage ${stage} of 5: ${stageLabels[stage]}`}
      className="inline-flex items-center gap-[3px]"
      role="img"
    >
      {[1, 2, 3, 4, 5].map((step) => (
        <span
          key={step}
          aria-hidden="true"
          className={`block h-[10px] w-3 ${step <= stage ? 'bg-accent' : 'border border-rule bg-paper'}`}
        />
      ))}
    </span>
  )
}

function Track({ kind, entry }) {
  if (!entry) {
    return (
      <div className="grid gap-3 border-t border-rule pt-5 md:grid-cols-[6.5rem_1fr] md:gap-6">
        <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">
          {kind}
        </p>
        <p className="font-serif text-[0.98rem] italic leading-7 text-muted">
          No credible humanoid effort targeting this occupation as of April
          2026. The form factor is not where this work is going.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 border-t border-rule pt-5 md:grid-cols-[6.5rem_1fr] md:gap-6">
      <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">
        {kind}
      </p>
      <div>
        <p className="font-serif text-xl font-semibold leading-tight text-ink md:text-[1.6rem]">
          {entry.company}
        </p>
        <p className="mt-1 font-sans text-xs text-muted md:text-[0.78rem]">
          {entry.system}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 font-sans text-[0.72rem] uppercase tracking-[0.08em] text-muted">
          <StagePill stage={entry.stage} />
          <span className="font-semibold text-ink">
            Stage {entry.stage} · {stageLabels[entry.stage]}
          </span>
          <span aria-hidden="true">·</span>
          <span>{entry.channel}</span>
        </div>
        <p className="mt-4 font-serif text-[1rem] leading-7 text-ink">
          {entry.note}
        </p>
        <a
          className="mt-3 inline-flex items-center gap-1 font-sans text-[0.78rem] text-accent underline decoration-rule underline-offset-4"
          href={entry.source_url}
          rel="noreferrer"
          target="_blank"
        >
          {entry.source_label} ↗
        </a>
      </div>
    </div>
  )
}

function RoboticsFrontier() {
  const { occupations, snapshot_label: snapshot } = frontier

  return (
    <div className="mx-auto mt-14 max-w-[980px] px-6">
      <div className="mb-10 flex flex-wrap items-baseline gap-x-6 gap-y-2 font-sans text-xs leading-6 text-muted">
        <span className="font-semibold uppercase tracking-[0.14em] text-accent">
          Snapshot · {snapshot}
        </span>
        <span>
          Hand-coded from public sources. Currency degrades fast in this
          category; treat each row as a 2026-Q2 reading, not a permanent
          score.
        </span>
      </div>
      <ol className="divide-y divide-rule border-y border-rule">
        {occupations.map((occupation, index) => (
          <li
            key={occupation.soc_code}
            className="grid gap-6 py-10 md:grid-cols-[5rem_1fr] md:gap-10"
          >
            <div className="flex flex-row items-baseline justify-between md:flex-col md:items-start md:justify-start md:gap-2">
              <span className="font-sans text-sm font-semibold tabular-nums text-accent">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="font-sans text-base font-semibold tabular-nums text-accent md:mt-1 md:text-lg">
                {formatMillions(occupation.national_employment)}
              </span>
            </div>
            <div>
              <h3 className="font-serif text-2xl font-semibold leading-tight text-ink md:text-3xl">
                {occupation.title}
              </h3>
              <div className="mt-7 space-y-7">
                <Track kind="Specialized" entry={occupation.specialized} />
                <Track kind="Humanoid" entry={occupation.humanoid} />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default RoboticsFrontier
