import { formatMillions } from '../data/story'
import frontier from '../../../data/processed/robotics_frontier.json'

const confidenceStyles = {
  high: 'text-accent',
  medium: 'text-ink',
  low: 'text-muted',
}

function stageLabel(stage) {
  if (!stage) return 'No deployment'
  return frontier.stage_scale[String(stage)]
}

function StagePill({ stage }) {
  const filledStage = stage ?? 0
  const label = stage
    ? `Stage ${stage} of 5: ${stageLabel(stage)}`
    : 'No deployment: zero of five stages filled'

  return (
    <span
      aria-label={label}
      className="inline-flex items-center gap-[3px]"
      role="img"
      title={stage ? `Stage ${stage}: ${stageLabel(stage)}` : 'No deployment'}
    >
      {[1, 2, 3, 4, 5].map((step) => (
        <span
          key={step}
          aria-hidden="true"
          className={`block h-[10px] w-3 ${step <= filledStage ? 'bg-accent' : 'border border-rule bg-paper'}`}
        />
      ))}
    </span>
  )
}

function StageSummary({ entry }) {
  return (
    <div className="grid gap-1 font-sans text-[0.72rem] uppercase tracking-[0.08em] text-muted">
      <StagePill stage={entry.stage} />
      <span className="font-semibold text-ink">
        {entry.stage ? `Stage ${entry.stage} · ${stageLabel(entry.stage)}` : stageLabel(entry.stage)}
      </span>
      {entry.stage ? <span>{entry.channel}</span> : null}
    </div>
  )
}

function Confidence({ value }) {
  return (
    <span className={`font-semibold capitalize ${confidenceStyles[value] ?? 'text-muted'}`}>
      {value}
    </span>
  )
}

function MatrixDesktop({ occupations }) {
  return (
    <div className="hidden overflow-x-auto border-y border-rule md:block">
      <table className="w-full border-collapse font-sans text-sm">
        <thead className="text-left text-[0.68rem] uppercase tracking-[0.12em] text-muted">
          <tr className="border-b border-rule">
            <th className="py-3 pr-5 font-semibold">Occupation</th>
            <th className="px-5 py-3 font-semibold">Employment</th>
            <th className="px-5 py-3 font-semibold">Specialized stage</th>
            <th className="px-5 py-3 font-semibold">Humanoid stage</th>
            <th className="px-5 py-3 font-semibold">Task slice covered</th>
            <th className="py-3 pl-5 font-semibold">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {occupations.map((occupation) => (
            <tr key={occupation.soc_code} className="border-b border-rule last:border-b-0">
              <td className="min-w-56 py-4 pr-5 font-semibold leading-5 text-ink">
                {occupation.title}
              </td>
              <td className="px-5 py-4 font-semibold tabular-nums text-accent">
                {formatMillions(occupation.national_employment)}
              </td>
              <td className="min-w-36 px-5 py-4">
                <StagePill stage={occupation.specialized.stage} />
              </td>
              <td className="min-w-36 px-5 py-4">
                <StagePill stage={occupation.humanoid.stage} />
              </td>
              <td className="min-w-80 px-5 py-4 leading-5 text-muted">
                {occupation.specialized.task_coverage}
              </td>
              <td className="py-4 pl-5">
                <Confidence value={occupation.specialized.confidence} />
                <span className="text-muted"> / </span>
                <Confidence value={occupation.humanoid.confidence} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MatrixMobile({ occupations }) {
  return (
    <div className="grid gap-4 border-y border-rule py-4 md:hidden">
      {occupations.map((occupation) => (
        <div key={occupation.soc_code} className="border-b border-rule pb-4 last:border-b-0 last:pb-0">
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-sans text-sm font-semibold leading-5 text-ink">
              {occupation.title}
            </p>
            <p className="shrink-0 font-sans text-sm font-semibold tabular-nums text-accent">
              {formatMillions(occupation.national_employment)}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 font-sans text-xs leading-5">
            <div>
              <p className="font-semibold uppercase tracking-[0.1em] text-muted">
                Specialized
              </p>
              <div className="mt-1">
                <StagePill stage={occupation.specialized.stage} />
              </div>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-[0.1em] text-muted">
                Humanoid
              </p>
              <div className="mt-1">
                <StagePill stage={occupation.humanoid.stage} />
              </div>
            </div>
          </div>
          <p className="mt-2 font-sans text-xs leading-5 text-muted">
            {occupation.specialized.task_coverage}
          </p>
        </div>
      ))}
    </div>
  )
}

function SourceList({ sources }) {
  if (!sources?.length) {
    return (
      <p className="font-sans text-xs leading-5 text-muted">
        No public deployment source attached; this row records an explicit absence call.
      </p>
    )
  }

  return (
    <ul className="grid gap-2 font-sans text-xs leading-5">
      {sources.map((item) => (
        <li key={`${item.label}-${item.url}`}>
          <a
            className="inline-flex min-h-11 items-center text-accent underline decoration-rule underline-offset-4"
            href={item.url}
            rel="noreferrer"
            target="_blank"
          >
            {item.label} ↗
          </a>
          <span className="block text-muted">
            {item.date} · {item.source_type} · {item.supports}
          </span>
        </li>
      ))}
    </ul>
  )
}

function Track({ kind, entry }) {
  return (
    <div className="grid gap-4 border-t border-rule pt-5 md:grid-cols-[7rem_1fr] md:gap-7">
      <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">
        {kind}
      </p>
      <div>
        {entry.status === 'observed' ? (
          <>
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
              <div>
                <p className="font-serif text-xl font-semibold leading-tight text-ink md:text-[1.55rem]">
                  {entry.company}
                </p>
                <p className="mt-1 font-sans text-xs text-muted md:text-[0.78rem]">
                  {entry.system}
                </p>
              </div>
              <StageSummary entry={entry} />
            </div>
          </>
        ) : (
          <StageSummary entry={entry} />
        )}

        <div className="mt-4 grid gap-3 border-l border-rule pl-4 font-sans text-xs leading-5 text-muted md:grid-cols-3 md:gap-5">
          <div>
            <p className="font-semibold uppercase tracking-[0.1em] text-ink">
              Task slice
            </p>
            <p className="mt-1">{entry.task_coverage}</p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-[0.1em] text-ink">
              Claim supported
            </p>
            <p className="mt-1">{entry.claim_supported}</p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-[0.1em] text-ink">
              Confidence
            </p>
            <p className="mt-1">
              <Confidence value={entry.confidence} /> · {entry.source_type}
            </p>
          </div>
        </div>

        <p className="mt-4 font-serif text-[1rem] leading-7 text-ink">
          {entry.note}
        </p>
        <div className="mt-4">
          <SourceList sources={entry.sources} />
        </div>
      </div>
    </div>
  )
}

function EvidenceRow({ occupation, index }) {
  return (
    <details className="group border-b border-rule last:border-b-0" open={index === 0}>
      <summary className="grid min-h-20 cursor-pointer list-none gap-4 py-6 marker:hidden md:grid-cols-[5rem_1fr_auto] md:items-baseline md:gap-8">
        <div className="flex items-baseline justify-between md:block">
          <span className="font-sans text-sm font-semibold tabular-nums text-accent">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="font-sans text-base font-semibold tabular-nums text-accent md:mt-2 md:block md:text-lg">
            {formatMillions(occupation.national_employment)}
          </span>
        </div>
        <div>
          <h3 className="font-serif text-2xl font-semibold leading-tight text-ink md:text-3xl">
            {occupation.title}
          </h3>
          <p className="mt-2 font-sans text-xs leading-5 text-muted">
            {occupation.specialized.task_coverage}
          </p>
        </div>
        <span className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-accent group-open:hidden">
          Open
        </span>
        <span className="hidden font-sans text-xs font-semibold uppercase tracking-[0.12em] text-muted group-open:inline">
          Close
        </span>
      </summary>
      <div className="pb-9 md:pl-[7rem]">
        <div className="space-y-7">
          <Track kind="Specialized" entry={occupation.specialized} />
          <Track kind="Humanoid" entry={occupation.humanoid} />
        </div>
      </div>
    </details>
  )
}

function RoboticsFrontier() {
  const { occupations, snapshot_label: snapshot } = frontier

  return (
    <div className="mx-auto mt-14 max-w-[1060px] px-6">
      <div className="mb-10 flex flex-wrap items-baseline gap-x-6 gap-y-2 font-sans text-xs leading-6 text-muted">
        <span className="font-semibold uppercase tracking-[0.14em] text-accent">
          Snapshot · {snapshot}
        </span>
        <span>
          Hand-coded from public sources. The comparison is task-level evidence,
          not a permanent occupation-level exposure score.
        </span>
      </div>

      <div className="mb-14">
        <div className="mb-5 font-sans">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-accent">
            Deployment comparison
          </p>
          <p className="mt-2 max-w-[720px] text-sm leading-6 text-muted">
            The important column is the task slice. Many systems are real and
            commercially meaningful, but still cover only a bounded portion of
            the occupation.
          </p>
        </div>
        <MatrixDesktop occupations={occupations} />
        <MatrixMobile occupations={occupations} />
      </div>

      <div className="border-y border-rule">
        {occupations.map((occupation, index) => (
          <EvidenceRow
            key={occupation.soc_code}
            index={index}
            occupation={occupation}
          />
        ))}
      </div>
    </div>
  )
}

export default RoboticsFrontier
