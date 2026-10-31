// Pure statistics over album frames.
import type { FilmId, Frame } from '../types'
import { dayKey } from './format'

export interface Stats {
  totalOfflineMs: number
  framesCount: number
  cleanCount: number
  foggedCount: number
  currentStreakDays: number
  longestStreakDays: number
  favoriteFilm: FilmId | null
  /** YYYY-MM-DD (local) → developed ms, for the last `HEATMAP_DAYS` days ending today (all keys present, 0 if empty). */
  byDay: Record<string, number>
  /** 24 buckets: developed ms by local start hour. */
  byHour: number[]
  /** Average developed ms per frame (0 if none). */
  averageSession: number
  /** Frames per film (all ids with ≥1 frame). */
  byFilm: Partial<Record<FilmId, number>>
}

export const HEATMAP_WEEKS = 26
export const HEATMAP_DAYS = HEATMAP_WEEKS * 7

const DAY = 86400000

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Add n calendar days (DST-safe). */
function addDays(ts: number, n: number): number {
  const d = new Date(ts)
  d.setDate(d.getDate() + n)
  return d.getTime()
}

/** Ordered list of day keys for the heatmap, oldest first, ending today. */
export function heatmapDays(now: number = Date.now(), days: number = HEATMAP_DAYS): string[] {
  const today = startOfDay(now)
  const out: string[] = []
  for (let i = days - 1; i >= 0; i--) out.push(dayKey(addDays(today, -i)))
  return out
}

export function computeStats(frames: readonly Frame[], now: number = Date.now()): Stats {
  const byHour = new Array<number>(24).fill(0)
  const byDay: Record<string, number> = {}
  for (const k of heatmapDays(now)) byDay[k] = 0

  let total = 0
  let clean = 0
  const filmCount: Partial<Record<FilmId, number>> = {}
  const filmMs: Partial<Record<FilmId, number>> = {}
  const activeDays = new Set<string>()

  for (const f of frames) {
    const ms = Math.max(0, f.developedMs || 0)
    total += ms
    if (!f.fogged) clean++
    filmCount[f.film] = (filmCount[f.film] ?? 0) + 1
    filmMs[f.film] = (filmMs[f.film] ?? 0) + ms
    const hour = Number.isInteger(f.hour) && f.hour >= 0 && f.hour < 24 ? f.hour : new Date(f.startedAt).getHours()
    byHour[hour] += ms
    const key = dayKey(f.finishedAt || f.startedAt)
    activeDays.add(key)
    if (key in byDay) byDay[key] += ms
  }

  let favoriteFilm: FilmId | null = null
  let best = -1
  let bestMs = -1
  for (const [id, c] of Object.entries(filmCount) as [FilmId, number][]) {
    const ms = filmMs[id] ?? 0
    if (c > best || (c === best && ms > bestMs)) {
      favoriteFilm = id
      best = c
      bestMs = ms
    }
  }

  return {
    totalOfflineMs: total,
    framesCount: frames.length,
    cleanCount: clean,
    foggedCount: frames.length - clean,
    currentStreakDays: currentStreak(activeDays, now),
    longestStreakDays: longestStreak(activeDays),
    favoriteFilm,
    byDay,
    byHour,
    averageSession: frames.length ? Math.round(total / frames.length) : 0,
    byFilm: filmCount,
  }
}

/** Consecutive active days ending today; if today is not yet active, a streak ending yesterday still counts. */
function currentStreak(days: Set<string>, now: number): number {
  let cursor = startOfDay(now)
  if (!days.has(dayKey(cursor))) cursor = addDays(cursor, -1)
  let n = 0
  while (days.has(dayKey(cursor))) {
    n++
    cursor = addDays(cursor, -1)
  }
  return n
}

function longestStreak(days: Set<string>): number {
  if (days.size === 0) return 0
  const sorted = [...days]
    .map((k) => {
      const [y, m, d] = k.split('-').map(Number)
      return new Date(y, m - 1, d).getTime()
    })
    .sort((a, b) => a - b)
  let best = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    // ~1 day apart (tolerate DST ±1h)
    const gap = Math.round((sorted[i] - sorted[i - 1]) / DAY)
    run = gap === 1 ? run + 1 : 1
    if (run > best) best = run
  }
  return best
}
