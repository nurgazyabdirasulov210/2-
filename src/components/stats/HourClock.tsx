import { motion, useReducedMotion } from 'framer-motion'
import { useId, useState, type KeyboardEvent } from 'react'
import { formatDuration } from '../../lib/format'
import { ChartTooltip } from './ChartTooltip'

const C = 150
const R0 = 52 // inner radius
const R1 = 138 // outer radius (max bar)
const PAD = 1.6 // degrees of gap between wedges (≈2px surface spacer)

function polar(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180
  return [C + r * Math.cos(a), C + r * Math.sin(a)]
}

function sector(r0: number, r1: number, a0: number, a1: number): string {
  const [x0, y0] = polar(r1, a0)
  const [x1, y1] = polar(r1, a1)
  const [x2, y2] = polar(r0, a1)
  const [x3, y3] = polar(r0, a0)
  return `M${x0} ${y0} A${r1} ${r1} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 0 0 ${x3} ${y3} Z`
}

const hh = (h: number) => `${String(h).padStart(2, '0')}:00`

/** 24-hour radial chart: when the user goes offline (developed ms by start hour). Midnight at top. */
export function HourClock({ byHour }: { byHour: number[] }) {
  const uid = useId()
  const reduced = useReducedMotion()
  const max = Math.max(1, ...byHour)
  const total = byHour.reduce((s, v) => s + v, 0)
  const peak = byHour.indexOf(Math.max(...byHour))
  const [active, setActive] = useState<number | null>(null)
  const shown = active ?? peak

  // partition of the day for the caption
  const parts = [
    { name: 'ночью', hours: [0, 1, 2, 3, 4, 5] },
    { name: 'утром', hours: [6, 7, 8, 9, 10, 11] },
    { name: 'днём', hours: [12, 13, 14, 15, 16, 17] },
    { name: 'вечером', hours: [18, 19, 20, 21, 22, 23] },
  ].map((p) => ({ ...p, ms: p.hours.reduce((s, h) => s + byHour[h], 0) }))
  const topPart = parts.reduce((a, b) => (b.ms > a.ms ? b : a))
  const share = total ? Math.round((topPart.ms / total) * 100) : 0
  const summary = total
    ? `Чаще всего вы уходите от экрана ${topPart.name}: ${share}% офлайн-времени. Пиковый час — ${hh(peak)}.`
    : 'Пока нет данных по часам.'

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
    setActive((a) => ((a ?? peak) + d + 24) % 24)
  }

  const midDeg = shown * 15 + 7.5
  const [tx, ty] = polar(R0 + ((R1 - R0) * Math.max(0.15, byHour[shown] / max)), midDeg)

  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto w-full max-w-[320px]">
        <svg
          viewBox="0 0 300 300"
          className="block h-auto w-full outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
          role="img"
          aria-labelledby={`${uid}-t ${uid}-d`}
          tabIndex={0}
          onKeyDown={onKey}
          onBlur={() => setActive(null)}
          onPointerLeave={() => setActive(null)}
        >
          <title id={`${uid}-t`}>Часы офлайна: когда начинаются сессии</title>
          <desc id={`${uid}-d`}>{summary}</desc>
          {/* night arc hint 22:00–06:00 */}
          <path d={sector(R1 + 4, R1 + 7, -30, 90)} fill="var(--data-4)" opacity={0.35} />
          <circle cx={C} cy={C} r={R1} fill="none" stroke="var(--border)" />
          <circle cx={C} cy={C} r={(R0 + R1) / 2} fill="none" stroke="var(--border)" strokeDasharray="2 4" />
          {byHour.map((v, h) => {
            const a0 = h * 15 + PAD / 2
            const a1 = (h + 1) * 15 - PAD / 2
            const len = v > 0 ? Math.max(0.06, v / max) : 0
            const r = R0 + (R1 - R0) * len
            const on = shown === h && (active != null || v > 0)
            return (
              <g key={h} onPointerEnter={() => setActive(h)} onPointerDown={() => setActive(h)}>
                <path d={sector(R0, R1, a0, a1)} fill="var(--surface-2)" opacity={0.6} />
                {v > 0 && (
                  <motion.path
                    d={sector(R0, r, a0, a1)}
                    fill="var(--data-2)"
                    initial={reduced ? false : { opacity: 0, scale: 0.6 }}
                    animate={{ opacity: active == null || on ? 1 : 0.4, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20, delay: reduced ? 0 : h * 0.02 }}
                    style={{ transformOrigin: `${C}px ${C}px` }}
                  />
                )}
              </g>
            )
          })}
          {[0, 6, 12, 18].map((h) => {
            const [x, y] = polar(R0 - 12, h * 15)
            return (
              <text key={h} x={x} y={y + 3.5} textAnchor="middle" fontSize={10} className="fill-text-3 font-mono">
                {String(h).padStart(2, '0')}
              </text>
            )
          })}
          <text x={C} y={C - 4} textAnchor="middle" className="fill-text-1 font-display" fontSize={26} fontStyle="italic">
            {hh(shown)}
          </text>
          <text x={C} y={C + 14} textAnchor="middle" className="fill-text-2 font-mono" fontSize={8.5} letterSpacing="0.12em">
            {active == null ? 'ЧАС ТИШИНЫ' : byHour[shown] > 0 ? formatDuration(byHour[shown]).toUpperCase() : '—'}
          </text>
        </svg>
        {active != null && (
          <ChartTooltip x={(tx / 300) * 100} y={(ty / 300) * 100} overline={`${hh(active)}–${hh((active + 1) % 24)}`} dot="var(--data-2)">
            {byHour[active] > 0 ? formatDuration(byHour[active]) : 'нет сессий'}
          </ChartTooltip>
        )}
      </div>
      <p className="text-center text-body-sm text-text-2">{summary}</p>
      <ul className="sr-only">
        {byHour.map((v, h) => (v > 0 ? <li key={h}>{`${hh(h)}: ${formatDuration(v)}`}</li> : null))}
      </ul>
    </div>
  )
}
