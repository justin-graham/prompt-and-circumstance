import Section from '../components/Section'

function Closing() {
  return (
    <Section className="border-t border-rule py-24">
      <p className="text-2xl leading-10 text-ink">
        The implication is not that conversation data are flawed. It is that a
        usage-based labor index can become more complete by adding a physical
        exposure layer for workers whose tasks rarely begin in a chat box.
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
          GitHub
        </a>
        <a className="text-accent underline decoration-rule underline-offset-4" href="mailto:">
          Contact
        </a>
      </div>
    </Section>
  )
}

export default Closing
