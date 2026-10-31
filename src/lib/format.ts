// RU formatting helpers. Pure, no DOM.

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

/** Russian plural form: pluralRu(5, ['кадр','кадра','кадров']) → 'кадров'. */
export function pluralRu(n: number, forms: readonly [string, string, string]): string {
  const a = Math.abs(Math.trunc(n))
  const m10 = a % 10
  const m100 = a % 100
  if (m10 === 1 && m100 !== 11) return forms[0]
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1]
  return forms[2]
}

/** "1 ч 25 мин", "25 мин", "2 ч", "<1 мин" → "0 мин" for 0, "1 мин" min for >0. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0 мин'
  const totalMin = Math.max(1, Math.round(ms / 60000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} мин`
  if (m === 0) return `${h} ч`
  return `${h} ч ${m} мин`
}

/** Countdown clock: "12:04" (mm:ss) or "1:02:03" (h:mm:ss) when ≥ 1 hour. Rounds up seconds. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil((Number.isFinite(ms) ? ms : 0) / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const ss = String(s).padStart(2, '0')
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}`
  return `${String(m).padStart(2, '0')}:${ss}`
}

/** "31 окт 2026" */
export function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

/** "14:05" local time of day. */
export function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Hours with one decimal for big stat numbers: 12.5 → "12,5". */
export function formatHours(ms: number): string {
  const h = ms / 3600000
  const r = h >= 10 ? Math.round(h) : Math.round(h * 10) / 10
  return String(r).replace('.', ',')
}

/** Local date key "YYYY-MM-DD". */
export function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
