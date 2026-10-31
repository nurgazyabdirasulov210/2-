/** Thin dial arc for development progress (0..1). Decorative; text equivalent is rendered by the parent. */
export function ProgressArc({ progress, color = '#ff6a55', className = '' }: { progress: number; color?: string; className?: string }) {
  const p = Math.min(1, Math.max(0, progress))
  // 200° arc, open at the bottom
  const r = 90
  const cx = 100
  const cy = 100
  const start = 170
  const sweep = 200
  const pt = (deg: number) => {
    const a = (deg * Math.PI) / 180
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  }
  const [x0, y0] = pt(start)
  const [x1, y1] = pt(start + sweep)
  const d = `M ${x0} ${y0} A ${r} ${r} 0 1 1 ${x1} ${y1}`
  const ticks = Array.from({ length: 21 }, (_, i) => start + (sweep * i) / 20)
  const [hx, hy] = pt(start + sweep * p)
  return (
    <svg viewBox="-10 -10 220 132" className={className} aria-hidden>
      {ticks.map((deg, i) => {
        const a = (deg * Math.PI) / 180
        const r1 = r + 7
        const r2 = r + (i % 5 === 0 ? 13 : 10)
        return (
          <line
            key={i}
            x1={cx + r1 * Math.cos(a)}
            y1={cy + r1 * Math.sin(a)}
            x2={cx + r2 * Math.cos(a)}
            y2={cy + r2 * Math.sin(a)}
            stroke={color}
            strokeOpacity={deg <= start + sweep * p ? 0.7 : 0.2}
            strokeWidth={i % 5 === 0 ? 1.2 : 0.8}
          />
        )
      })}
      <path d={d} fill="none" stroke={color} strokeOpacity={0.16} strokeWidth={1.5} strokeLinecap="round" />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - p}
        style={{ transition: 'stroke-dashoffset 600ms linear', filter: `drop-shadow(0 0 4px ${color})` }}
      />
      <circle cx={hx} cy={hy} r={2.6} fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
    </svg>
  )
}
