const sizes = {
  default: 'text-6xl md:text-7xl',
  compact: 'text-5xl md:text-5xl',
}

function StatCallout({ value, label, size = 'default' }) {
  return (
    <aside className="my-12 border-y border-rule py-8">
      <p className={`font-serif font-semibold leading-none text-accent ${sizes[size]}`}>
        {value}
      </p>
      <p className="mt-4 max-w-[34rem] font-sans text-sm leading-6 text-muted">
        {label}
      </p>
    </aside>
  )
}

export default StatCallout
