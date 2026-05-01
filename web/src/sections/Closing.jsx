import FullWidthVideo from '../components/FullWidthVideo'
import Section from '../components/Section'

function Closing() {
  return (
    <>
      <Section className="border-t border-rule py-24">
        <p className="text-2xl leading-10 text-ink">
          A Claude usage-based labor index can become more complete by adding a
          physical exposure layer for workers whose tasks rarely begin in a chat
          box.
        </p>
        <p className="mt-6 text-lg leading-8 text-muted">
          For anyone outside the labs and statistical agencies, the stake is
          simpler: if AI&apos;s effect on work is measured only through what
          passes through a chat window, then roughly half the labor force is
          invisible to the policy conversation that follows. Prompt and
          circumstance.
        </p>
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 font-sans text-sm font-medium">
          <a
            className="text-accent underline decoration-rule underline-offset-4"
            href={`${import.meta.env.BASE_URL}METHODOLOGY.md`}
          >
            Methodology
          </a>
          <a
            className="text-accent underline decoration-rule underline-offset-4"
            href="https://github.com/justin-graham/prompt-and-circumstance"
          >
            Code & data on GitHub
          </a>
          <a
            className="text-accent underline decoration-rule underline-offset-4"
            href="https://www.raindroprace.com/contact"
          >
            Contact
          </a>
        </div>
      </Section>
      <FullWidthVideo
        ariaLabel="Prompt and Circumstance closing video"
        className="border-t"
      />
    </>
  )
}

export default Closing
