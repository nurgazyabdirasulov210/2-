import { useEffect, useRef, useState } from 'react'
import { FrameCanvas } from '../FrameCanvas'
import type { FrameParams } from '../../types'

/** FrameCanvas that only mounts once scrolled near the viewport (and stays mounted). */
export function LazyFrame({ params, label, className = '' }: { params: FrameParams; label?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    const el = ref.current
    if (!el || visible) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '400px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [visible])
  return (
    <div ref={ref} className={`relative aspect-[4/5] w-full bg-[#1a1613] ${className}`}>
      {visible && <FrameCanvas params={params} maxDpr={1} label={label} className="h-full" />}
    </div>
  )
}
