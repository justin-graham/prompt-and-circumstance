function Section({ kicker, title, children, className = '' }) {
  return (
    <section className={`mx-auto max-w-[720px] px-6 ${className}`}>
      {kicker ? (
        <p className="mb-5 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-accent">
          {kicker}
        </p>
      ) : null}
      {title ? (
        <h2 className="max-w-[680px] font-serif text-4xl font-semibold leading-[1.08] text-ink md:text-5xl">
          {title}
        </h2>
      ) : null}
      <div className="mt-8 space-y-6 text-[1.08rem] leading-[1.72] text-ink md:text-[1.16rem]">
        {children}
      </div>
    </section>
  )
}

export default Section
