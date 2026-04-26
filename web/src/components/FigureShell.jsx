function FigureShell({ eyebrow, title, children, fullBleed = false, className = '' }) {
  const body = (
    <figure
      className={`border-y border-rule bg-rule/20 px-6 py-8 md:px-10 md:py-10 ${className}`}
    >
      <figcaption className="mb-7 font-sans">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-accent">
          {eyebrow}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">{title}</p>
      </figcaption>
      {children}
    </figure>
  )

  if (!fullBleed) {
    return <div className="my-12">{body}</div>
  }

  return (
    <div className="relative left-1/2 my-14 w-screen -translate-x-1/2">
      {body}
    </div>
  )
}

export default FigureShell
