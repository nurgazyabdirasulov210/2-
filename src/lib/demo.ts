// Demo album: plausible frames for empty-state previews and screenshots.
// Pure & deterministic for a given `now` — nothing here touches persistence.
// Only an explicit «Загрузить пример» click should call useStudio.setState({ frames }).
import { create } from 'zustand'
import type { FilmId, Frame, Weather } from '../types'

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FILM_WEIGHTS: [FilmId, number][] = [
  ['portra', 7],
  ['ilford', 4],
  ['cinestill', 4],
  ['aurora', 3],
  ['cyan', 3],
  ['polaroid', 3],
]

const INTENTIONS = [
  'Дочитать «Пикник на обочине»',
  'Прогулка вдоль реки',
  'Испечь хлеб на закваске',
  'Позвонить бабушке',
  'Просто полежать и посмотреть в потолок',
  'Пробежка в парке',
  'Разобрать старые плёнки',
  'Ужин без телефона',
  'Нарисовать вид из окна',
  'Йога и растяжка',
  'Поиграть на гитаре',
  'Написать письмо от руки',
  'Сходить на рынок за яблоками',
  'Вечерний чай на балконе',
  'Пересадить монстеру',
  'Партия в шахматы с соседом',
  'Медленное утро',
  'Собрать пазл на 1000 деталей',
  'Выучить пару аккордов',
  '',
  '',
  '',
]

const WEATHER_PRESETS: { code: number; label: string; cloud: number; precip: number }[] = [
  { code: 0, label: 'Ясно', cloud: 4, precip: 0 },
  { code: 1, label: 'Преимущественно ясно', cloud: 18, precip: 0 },
  { code: 2, label: 'Переменная облачность', cloud: 48, precip: 0 },
  { code: 3, label: 'Пасмурно', cloud: 92, precip: 0 },
  { code: 45, label: 'Туман', cloud: 100, precip: 0 },
  { code: 61, label: 'Лёгкий дождь', cloud: 88, precip: 0.6 },
  { code: 63, label: 'Дождь', cloud: 96, precip: 2.4 },
  { code: 71, label: 'Лёгкий снег', cloud: 90, precip: 0.4 },
]

const MIN = 60000
const DAY = 86400000

function pickWeighted<T>(rnd: () => number, items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0)
  let r = rnd() * total
  for (const [v, w] of items) {
    if ((r -= w) <= 0) return v
  }
  return items[items.length - 1][0]
}

function pickHour(rnd: () => number): number {
  // Evenings dominate, mornings second, a few lunch breaks.
  return pickWeighted(rnd, [
    [7, 3], [8, 4], [9, 2], [12, 2], [13, 2], [15, 1], [17, 1],
    [19, 3], [20, 5], [21, 6], [22, 5], [23, 2],
  ])
}

/**
 * Generate `n` plausible frames over the last ~60 days (newest last, numbered 1..n).
 * Deterministic for the same `now` (rounded to the day), so screenshots are stable.
 */
export function makeDemoFrames(n = 24, now: number = Date.now()): Frame[] {
  const rnd = mulberry32(0x5eed + n)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  // Choose distinct-ish days: a recent streak of 5 days + scattered earlier days.
  const dayOffsets: number[] = []
  const streak = Math.min(5, n)
  for (let i = 0; i < streak; i++) dayOffsets.push(i)
  while (dayOffsets.length < n) {
    const d = 5 + Math.floor(Math.pow(rnd(), 0.9) * 56)
    // allow up to two sessions on the same day
    if (dayOffsets.filter((x) => x === d).length < 2) dayOffsets.push(d)
  }

  const frames: Frame[] = dayOffsets.map((offset, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() - offset)
    let hour = pickHour(rnd)
    if (offset === 0) hour = Math.min(hour, Math.max(0, new Date(now).getHours() - 1))
    date.setHours(hour, Math.floor(rnd() * 60), 0, 0)
    const startedAt = Math.min(date.getTime(), now - 2 * 60 * MIN)

    const durationMs = pickWeighted<number>(rnd, [[10 * MIN, 2], [25 * MIN, 5], [45 * MIN, 4], [90 * MIN, 2], [60 * MIN, 1]])
    const fogged = rnd() < 0.2
    const peeks = fogged ? 1 + Math.floor(rnd() * 3) : rnd() < 0.3 ? 1 + Math.floor(rnd() * 2) : 0
    const developedMs = fogged ? Math.round(durationMs * (0.25 + rnd() * 0.55)) : durationMs
    const finishedAt = startedAt + developedMs + peeks * 40000

    let weather: Weather | null = null
    if (rnd() < 0.75) {
      const w = WEATHER_PRESETS[Math.floor(rnd() * WEATHER_PRESETS.length)]
      const month = date.getMonth()
      const base = month >= 10 || month <= 2 ? -2 : month >= 5 && month <= 7 ? 21 : 9
      weather = {
        temperature: Math.round(base + (rnd() - 0.4) * 10 + (w.code === 71 ? -6 : 0)),
        weatherCode: w.code,
        cloudCover: w.cloud,
        precipitation: w.precip,
        isDay: hour >= 7 && hour < 18,
        windSpeed: Math.round(2 + rnd() * 18),
        label: w.label,
      }
    }

    return {
      id: `demo-${(i + 1).toString(36)}-${Math.floor(rnd() * 1e9).toString(36)}`,
      number: 0,
      film: pickWeighted(rnd, FILM_WEIGHTS),
      intention: INTENTIONS[Math.floor(rnd() * INTENTIONS.length)],
      seed: Math.floor(rnd() * 0xffffffff) >>> 0,
      weather,
      hour,
      peeks,
      fogged,
      durationMs,
      developedMs,
      startedAt,
      finishedAt,
      favorite: !fogged && rnd() < 0.28,
    }
  })

  frames.sort((a, b) => a.startedAt - b.startedAt)
  frames.forEach((f, i) => (f.number = i + 1))
  return frames
}

let cached: { day: number; frames: Frame[] } | null = null
/** Memoized demo album for today (stable ids within a page lifetime). */
export function getDemoFrames(): Frame[] {
  const day = Math.floor(Date.now() / DAY)
  if (!cached || cached.day !== day) cached = { day, frames: makeDemoFrames(24) }
  return cached.frames
}

export function isDemoId(id: string | undefined): boolean {
  return !!id && id.startsWith('demo-')
}

/** In-memory (never persisted) flag: the user is browsing the example album. */
export const useDemoPreview = create<{ on: boolean; set(on: boolean): void }>((set) => ({
  on: false,
  set: (on) => set({ on }),
}))
