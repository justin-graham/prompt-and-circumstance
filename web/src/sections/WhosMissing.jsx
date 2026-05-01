import Section from '../components/Section'
import { formatMillions, story } from '../data/story'

function WhosMissing() {
  const topTenEmployment = story.topMissing.reduce(
    (sum, occupation) => sum + occupation.national_employment,
    0,
  )

  return (
    <section className="border-y border-rule bg-rule/20 py-24 md:py-32">
      <Section kicker="Who's missing" title="The gap becomes clearer when the occupations have names.">
        <p>
          The ten largest low-coverage occupations account for about{' '}
          {formatMillions(topTenEmployment)}{' '}
          workers: food service, freight movement, cleaning, driving,
          maintenance, assembly, cooking, and care work.
        </p>
      </Section>

      <div className="mx-auto mt-14 max-w-[980px] px-6">
        <ol className="divide-y divide-rule border-y border-rule">
          {story.topMissing.map((occupation, index) => (
            <li
              key={occupation.soc_code}
              className="grid gap-5 py-6 md:grid-cols-[5rem_1fr_12rem] md:items-baseline md:gap-8"
            >
              <span className="font-sans text-sm font-semibold text-accent">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="font-serif text-3xl font-semibold leading-[1.12] text-ink md:text-5xl">
                {occupation.title}
              </span>
              <span className="font-sans text-xl font-semibold tabular-nums text-accent md:text-right md:text-2xl">
                {formatMillions(occupation.national_employment)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default WhosMissing
