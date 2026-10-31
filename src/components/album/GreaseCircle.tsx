import { motion, useReducedMotion } from 'framer-motion'
import { useId, useMemo } from 'react'

function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Hand-drawn wobbly loop, deterministic per seed, in a 0..100 box. Ends overshoot the start like a real pencil stroke. */
function loopPath(seed: number): string {
  const r = mulberry(seed || 1)
  const start = -Math.PI * (0.55 + r() * 0.3)
  const span = Math.PI * 2 + 0.35 + r() * 0.35
  const p1 = r() * 6.28
  const p2 = r() * 6.28
  const tilt = (r() - 0.5) * 0.12
  const steps = 72
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = start + span * t
    const wob = 1 + 0.028 * Math.sin(3 * a + p1) + 0.018 * Math.sin(5 * a + p2)
    const drift = 1 - 0.055 * t // spirals slightly inward so the overlap is visible
    const rx = 48 * wob * drift
    const ry = 47 * wob * drift
    const x = 50 + rx * Math.cos(a) * Math.cos(tilt) - ry * Math.sin(a) * Math.sin(tilt)
    const y = 50 + rx * Math.cos(a) * Math.sin(tilt) + ry * Math.sin(a) * Math.cos(tilt)
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  return pts.join(' ')
}

/**
 * Red grease-pencil circle, the editor's mark on a contact sheet.
 * Absolutely fills its (relative) parent with a small bleed.
 */
export function GreaseCircle({
  seed,
  show,
  bleed = '-9%',
  width = 3.2,
  animate = true,
}: {
  seed: number
  show: boolean
  bleed?: string
  width?: number
  animate?: boolean
}) {
  const id = useId().replace(/:/g, '')
  const reduced = useReducedMotion()
  const d = useMemo(() => loopPath(seed), [seed])
  if (!show) return null
  const instant = reduced || !animate
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute z-10 overflow-visible"
      style={{ inset: bleed, width: `calc(100% - 2 * ${bleed})`, height: `calc(100% - 2 * ${bleed})` }}
    >
      <defs>
        <filter id={`wax-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed % 97} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" />
        </filter>
      </defs>
      <g filter={`url(#wax-${id})`} style={{ mixBlendMode: 'normal' }}>
        <motion.path
          d={d}
          fill="none"
          stroke="#E0332A"
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={instant ? false : { pathLength: 0, opacity: 0.4 }}
          animate={{ pathLength: 1, opacity: 0.92 }}
          transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }}
        />
        <motion.path
          d={d}
          fill="none"
          stroke="#FF6A55"
          strokeWidth={width * 0.35}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          transform="translate(0.6 -0.5)"
          initial={instant ? false : { pathLength: 0 }}
          animate={{ pathLength: 1, opacity: 0.45 }}
          transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }}
        />
      </g>
    </svg>
  )
}
