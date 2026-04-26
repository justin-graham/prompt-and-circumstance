import { formatMillions, story } from '../data/story'

function Hero() {
  return (
    <header className="mx-auto flex min-h-[84svh] max-w-[980px] flex-col justify-center px-6 pb-16 pt-20">
      <p className="mb-8 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-accent">
        The Invisible Workforce
      </p>
      <h1 className="max-w-[900px] break-words font-serif text-[2.45rem] font-semibold leading-[1.06] text-ink md:text-[3.7rem] md:leading-[1.04] lg:text-[3.95rem]">
        Roughly 44% of U.S. workers sit in occupations barely visible to current
        AI labor market data.
      </h1>
      <p className="mt-8 max-w-[680px] text-lg leading-8 text-muted md:text-2xl md:leading-10">
        In May 2024 OEWS employment, that is roughly{' '}
        {formatMillions(story.metrics.gapEmployment)} workers whose jobs are
        easy to miss when the measurement frame begins with Claude.ai
        conversations.
      </p>
    </header>
  )
}

export default Hero
