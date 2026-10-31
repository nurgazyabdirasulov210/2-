import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react'
import { formatDuration, pluralRu } from '../../lib/format'
import { ChartTooltip } from './ChartTooltip'
import { HEAT_LEVELS } from './heatLevels'

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const CELL = 14
const GAP = 3
const STEP = CELL + GAP
const LEFT = 26
const TOP = 18

const THRESH_MIN = [1, 20, 45, 90] // minutes → level 1..4

function level(ms: number): number {
  const m = ms / 60000
  let l = 0
  for (const t of THRESH_MIN) if (m >= t) l++
  return l
}

function parseKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}

interface Cell {
  key: string
  date: Date
  ms: number
  col: number
  row: number
}

function useNarrow(): boolean {
  const q = '(max-width: 639px)'
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return m
}

/** 26-week (13 on phones) calendar heatmap (weeks as columns, Monday first). `days` must be ordered oldest → today. */
export function Heatmap({ byDay }: { byDay: Record<string, number> }) {
  const uid = useId()
  const narrow = useNarrow()
  const weeks = narrow ? 13 : 26
  const keys = useMemo(() => Object.keys(byDay).sort().slice(-weeks * 7), [byDay, weeks])
  const { cells, cols, monthTicks } = useMemo(() => {
    if (!keys.length) return { cells: [] as Cell[], cols: 0, monthTicks: [] as { col: number; label: string }[] }
    const first = parseKey(keys[0])
    const offset = (first.getDay() + 6) % 7
    const cells: Cell[] = keys.map((key, i) => {
      const idx = i + offset
      return { key, date: parseKey(key), ms: byDay[key] ?? 0, col: Math.floor(idx / 7), row: idx % 7 }
    })
    const cols = cells[cells.length - 1].col + 1
    const monthTicks: { col: number; label: string }[] = []
    for (const c of cells) {
      if (c.date.getDate() === 1) monthTicks.push({ col: c.col + (c.row > 3 ? 1 : 0), label: MONTHS[c.date.getMonth()] })
    }
    return { cells, cols, monthTicks }
  }, [keys, byDay])

  const [active, setActive] = useState<number | null>(null)
  const W = LEFT + cols * STEP
  const H = TOP + 7 * STEP
  const activeDays = cells.filter((c) => c.ms > 0)
  const best = activeDays.reduce<Cell | null>((b, c) => (!b || c.ms > b.ms ? c : b), null)
  const total = activeDays.reduce((s, c) => s + c.ms, 0)
  const summary =
    `Календарь за ${weeks} недель: ${activeDays.length} ${pluralRu(activeDays.length, ['день', 'дня', 'дней'])} без экрана, всего ${formatDuration(total)}.` +
    (best ? ` Самый долгий день — ${best.date.getDate()} ${MONTHS_GEN[best.date.getMonth()]}, ${formatDuration(best.ms)}.` : '')

  const onKey = (e: KeyboardEvent) => {
    const d = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1, Home: -Infinity, End: Infinity }[e.key]
    if (d === undefined) return
    e.preventDefault()
    setActive((a) => {
      const cur = a ?? cells.length - 1
      if (d === -Infinity) return 0
      if (d === Infinity) return cells.length - 1
      return Math.min(cells.length - 1, Math.max(0, cur + d))
    })
  }

  const a = active != null ? cells[active] : null
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
      <div className="relative w-full" style={{ maxWidth: W * 1.55 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ maxWidth: W * 1.55 }}
          className="block h-auto w-full touch-pan-y outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
          role="img"
          aria-labelledby={`${uid}-t ${uid}-d`}
          tabIndex={0}
          onKeyDown={onKey}
          onFocus={() => setActive((x) => x ?? cells.length - 1)}
          onBlur={() => setActive(null)}
          onPointerLeave={() => setActive(null)}
        >
          <title id={`${uid}-t`}>Тепловой календарь офлайн-времени</title>
          <desc id={`${uid}-d`}>{summary} Стрелки — перемещение по дням.</desc>
          {monthTicks.map((m) => (
            <text key={`${m.col}-${m.label}`} x={LEFT + m.col * STEP} y={11} className="fill-text-3 font-mono" fontSize={9.5}>
              {m.label}
            </text>
          ))}
          {[0, 2, 4].map((r) => (
            <text key={r} x={0} y={TOP + r * STEP + CELL - 3} className="fill-text-3 font-mono" fontSize={9}>
              {WD[r]}
            </text>
          ))}
          {cells.map((c, i) => {
            const l = level(c.ms)
            const isToday = i === cells.length - 1
            return (
              <rect
                key={c.key}
                x={LEFT + c.col * STEP}
                y={TOP + c.row * STEP}
                width={CELL}
                height={CELL}
                rx={3}
                fill={HEAT_LEVELS[l]}
                stroke={active === i ? 'var(--text-1)' : isToday ? 'var(--text-3)' : l === 0 ? 'var(--border)' : 'none'}
                strokeWidth={active === i ? 1.5 : 1}
                style={l === 4 ? { filter: 'drop-shadow(0 0 4px var(--safelight-glow))' } : undefined}
                onPointerEnter={() => setActive(i)}
                onPointerDown={() => setActive(i)}
              />
            )
          })}
        </svg>
        {a && (
          <ChartTooltip
            x={((LEFT + a.col * STEP + CELL / 2) / W) * 100}
            y={((TOP + a.row * STEP) / H) * 100}
            overline={`${WD[(a.date.getDay() + 6) % 7]}, ${a.date.getDate()} ${MONTHS_GEN[a.date.getMonth()]}`}
            dot={HEAT_LEVELS[Math.max(1, level(a.ms))]}
          >
            {a.ms > 0 ? `${Math.round(a.ms / 60000)} мин без экрана` : 'Экран победил'}
          </ChartTooltip>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-caption text-text-3 lg:max-w-64 lg:flex-col lg:items-start lg:gap-5">
        <p className="text-body-sm text-text-2">{summary}</p>
        <div className="flex items-center gap-1.5" aria-hidden>
          <span>меньше</span>
          {HEAT_LEVELS.map((c, i) => (
            <span key={i} className="size-3 rounded-[3px]" style={{ background: c, outline: i === 0 ? '1px solid var(--border)' : undefined }} />
          ))}
          <span>больше</span>
        </div>
      </div>
      <table className="sr-only">
        <caption>Дни с офлайн-временем</caption>
        <thead>
          <tr>
            <th>Дата</th>
            <th>Минут</th>
          </tr>
        </thead>
        <tbody>
          {activeDays.map((c) => (
            <tr key={c.key}>
              <td>{`${c.date.getDate()} ${MONTHS_GEN[c.date.getMonth()]} ${c.date.getFullYear()}`}</td>
              <td>{Math.round(c.ms / 60000)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
