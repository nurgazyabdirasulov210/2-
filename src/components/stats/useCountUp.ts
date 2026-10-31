import { useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

/** Counts 0 → value (easeOutQuint) once the element enters the viewport. Instant under reduced motion. */
export function useCountUp<T extends Element>(value: number, duration = 1400) {
  const ref = useRef<T>(null)
  const reduced = useReducedMotion()
  const [v, setV] = useState(reduced ? value : 0)
  const started = useRef(false)

  useEffect(() => {
    if (reduced) {
      setV(value)
      return
    }
    const el = ref.current
    let raf = 0
    const run = () => {
      started.current = true
      const t0 = performance.now()
      const from = 0
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration)
        const e = 1 - Math.pow(1 - p, 5)
        setV(from + (value - from) * e)
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    if (started.current || !el || typeof IntersectionObserver === 'undefined') {
      if (started.current) setV(value)
      else run()
      return () => cancelAnimationFrame(raf)
    }
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        io.disconnect()
        run()
      }
    })
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value, duration, reduced])

  return [ref, v] as const
}
