// Poetic one-liner generated from the album.
import { pluralRu } from '../../lib/format'
import type { Frame } from '../../types'
import { monthPrep } from '../album/films'

const HOUR = 3600000

/** "14 часов", "2,5 часа", "1 час", "40 минут". */
export function hoursPhrase(ms: number): string {
  if (ms < HOUR) {
    const m = Math.max(1, Math.round(ms / 60000))
    return `${m} ${pluralRu(m, ['минута', 'минуты', 'минут'])}`
  }
  const h = ms / HOUR
  const r = h >= 10 ? Math.round(h) : Math.round(h * 10) / 10
  if (!Number.isInteger(r)) return `${String(r).replace('.', ',')} часа`
  return `${r} ${pluralRu(r, ['час', 'часа', 'часов'])}`
}

function equivalents(ms: number): string {
  const h = ms / HOUR
  const books = Math.floor(h / 4.5)
  const km = Math.round(h * 3)
  const out: string[] = []
  if (books >= 1) out.push(`${books} ${pluralRu(books, ['прочитанная книга', 'прочитанные книги', 'прочитанных книг'])}`)
  else {
    const pages = Math.max(1, Math.round((h * 60) / 2))
    out.push(`${pages} ${pluralRu(pages, ['страница', 'страницы', 'страниц'])} хорошей книги`)
  }
  if (km >= 1) out.push(`${km} ${pluralRu(km, ['километр', 'километра', 'километров'])} прогулок`)
  else {
    const cups = Math.max(1, Math.round((h * 60) / 15))
    out.push(`${cups} ${pluralRu(cups, ['чашка', 'чашки', 'чашек'])} чая без спешки`)
  }
  return out.join(' или ')
}

export function poeticSummary(frames: readonly Frame[], now: number = Date.now()): string {
  if (!frames.length) return ''
  const d = new Date(now)
  const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime()
  const month = frames.filter((f) => f.startedAt >= monthStart).reduce((s, f) => s + f.developedMs, 0)
  if (month >= 15 * 60000) {
    return `В ${monthPrep(d.getMonth())} — ${hoursPhrase(month)} без экрана: это ${equivalents(month)}.`
  }
  const since = now - 30 * 86400000
  const last30 = frames.filter((f) => f.startedAt >= since).reduce((s, f) => s + f.developedMs, 0)
  if (last30 >= 15 * 60000) {
    return `За последние тридцать дней — ${hoursPhrase(last30)} без экрана: это ${equivalents(last30)}.`
  }
  const all = frames.reduce((s, f) => s + f.developedMs, 0)
  return `Всего — ${hoursPhrase(all)} без экрана: это ${equivalents(all)}. Хорошее начало.`
}
