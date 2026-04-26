import { useEffect, useRef, useState } from 'react'

function useMeasure() {
  const ref = useRef(null)
  const [bounds, setBounds] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!ref.current) return undefined
    const observer = new ResizeObserver(([entry]) => {
      setBounds(entry.contentRect)
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return [ref, bounds]
}

export default useMeasure
