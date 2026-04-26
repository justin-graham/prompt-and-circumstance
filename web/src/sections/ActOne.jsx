import FigureShell from '../components/FigureShell'
import Section from '../components/Section'
import StatCallout from '../components/StatCallout'
import { formatMillions, formatPercent, story } from '../data/story'

const tierLabels = {
  low: 'Low EI representation',
  medium: 'Medium EI representation',
  high: 'High EI representation',
  unmatched: 'Unmatched',
}

const tierDescriptions = {
  low: 'EI score below 0.02',
  medium: 'EI score from 0.02 to 0.08',
  high: 'EI score at or above 0.08',
  unmatched: 'Major-group employment not matched to detail rows',
}

const tierColors = {
  low: 'bg-accent',
  medium: 'bg-accent/55',
  high: 'bg-muted/35',
  unmatched: 'bg-rule/50',
}

function ActOne() {
  return (
    <Section kicker="Act 1" title="The coverage gap is large enough to shape the measurement frame." className="py-24">
      <p>
        Anthropic&apos;s Economic Index measures where Claude is being used at
        work. That makes it unusually concrete: the data are not forecasts or
        self-reports, but traces of actual interactions with AI systems.
      </p>
      <p>
        The limitation is structural. Occupations that do not naturally route
        work through a text interface are less likely to appear, even when AI
        could eventually affect their tasks through robotics, inspection,
        scheduling, teleoperation, or exception handling.
      </p>
      <FigureShell
        eyebrow="Occupation coverage"
        title="Employment-weighted representation tiers across detailed occupations matched to May 2024 OEWS employment."
      >
        <div>
          <div
            aria-label="Employment coverage tiers: low 40.6 percent, medium 12.9 percent, high 38.2 percent, unmatched 8.3 percent."
            className="flex h-16 w-full overflow-hidden border border-rule bg-paper"
            role="img"
          >
            {story.coverageTiers.map((tier) => (
              <div
                key={tier.flag}
                aria-hidden="true"
                className={`${tierColors[tier.flag]} h-full`}
                style={{ width: `${tier.share * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-4 hidden gap-4 md:flex">
            {story.coverageTiers.map((tier) => (
              <div
                key={tier.flag}
                className="font-sans text-xs leading-5"
                style={{ width: `${tier.share * 100}%` }}
              >
                <p className="font-semibold tabular-nums text-ink">
                  {formatPercent(tier.share)}
                </p>
                <p className="text-muted">{tierLabels[tier.flag]}</p>
              </div>
            ))}
          </div>
          <div className="mt-7 grid gap-3 border-t border-rule pt-5 font-sans text-xs leading-5 text-muted md:grid-cols-2">
          {story.coverageTiers.map((tier) => (
            <div key={tier.flag} className="flex gap-3">
              <span
                className={`${tierColors[tier.flag]} mt-1 h-3 w-3 shrink-0 border border-rule`}
              />
              <p>
                <span className="font-semibold text-ink">{tierLabels[tier.flag]}:</span>{' '}
                {tierDescriptions[tier.flag]}
              </p>
            </div>
          ))}
          </div>
        </div>
      </FigureShell>
      <StatCallout
        value={formatMillions(story.metrics.gapEmployment)}
        label={`Workers fall below the low-coverage threshold, defined as an Economic Index representation score under ${formatPercent(0.02, 0)}.`}
      />
    </Section>
  )
}

export default ActOne
