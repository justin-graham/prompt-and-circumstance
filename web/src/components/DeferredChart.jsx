import { useEffect, useRef, useState } from 'react'

function DeferredChart({ loader, minHeight = 320 }) {
  const ref = useRef(null)
  const [Component, setComponent] = useState(null)

  useEffect(() => {
    if (!ref.current || Component) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        loader().then((module) => {
          setComponent(() => module.default)
        })
      },
      { rootMargin: '640px 0px' },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [Component, loader])

  return (
    <div ref={ref} style={{ minHeight: Component ? undefined : minHeight }}>
      {Component ? (
        <Component />
      ) : (
        <div className="flex h-full min-h-80 items-center justify-center border-y border-rule font-sans text-sm text-muted">
          Loading visualization
        </div>
      )}
    </div>
  )
}

export default DeferredChart
