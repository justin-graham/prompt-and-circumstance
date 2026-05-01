import FullWidthVideo from '../components/FullWidthVideo'
import { formatMillions, story } from '../data/story'

const heroPreview = [
  { label: 'Fast-food & counter workers', employment: 3780930 },
  { label: 'Freight movers', employment: 2982530 },
  { label: 'Stockers & order fillers', employment: 2779530 },
  { label: 'Waiters & waitresses', employment: 2302690 },
  { label: 'Janitors & cleaners', employment: 2199900 },
]

function Hero() {
  return (
    <header className="flex min-h-[84svh] w-full flex-col pb-16">
      <FullWidthVideo ariaLabel="Prompt and Circumstance opening video" />
      <div className="mx-auto flex w-full max-w-[980px] flex-1 flex-col justify-center px-6 pt-12 md:pt-16">
        <p className="mb-8 font-sans text-[0.86rem] font-semibold uppercase tracking-normal text-accent md:text-[0.92rem]">
          Prompt and Circumstance
        </p>
        <h1 className="max-w-[900px] break-words font-serif text-[2.45rem] font-semibold leading-[1.06] text-ink md:text-[3.7rem] md:leading-[1.04] lg:text-[3.95rem]">
          44% of U.S. workers sit in occupations barely visible to current
          AI labor market data.
        </h1>
        <p className="mt-8 max-w-[680px] text-lg leading-8 text-muted md:text-2xl md:leading-10">
          That's roughly{' '}
          {formatMillions(story.metrics.gapEmployment)} workers whose jobs are
          easy to miss when the measurement frame begins with Claude
          conversations.
        </p>
        <ul
          aria-label="Five of the largest occupations with minimal Economic Index representation."
          className="mt-12 grid max-w-[820px] gap-x-8 gap-y-4 border-t border-rule pt-7 font-sans text-sm leading-6 text-ink sm:grid-cols-2 md:grid-cols-[repeat(5,minmax(0,1fr))] md:gap-x-6 md:text-[0.82rem]"
        >
          {heroPreview.map((occupation) => (
            <li key={occupation.label} className="flex flex-col">
              <span className="font-serif text-2xl font-semibold leading-none tabular-nums text-accent md:text-[1.6rem]">
                {formatMillions(occupation.employment)}
              </span>
              <span className="mt-2 text-muted md:text-[0.78rem]">
                {occupation.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}

export default Hero
