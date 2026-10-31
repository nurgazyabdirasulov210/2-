// Print export + share — one implementation for the reveal screen and the frame detail page.
import { exportFramePNG, FILMS } from '../engine'
import type { Frame } from '../types'
import { formatDate, formatDuration } from './format'

/** Long edge of the exported image (px). The bordered print is ~1.1× wider. */
const PRINT_SIZE = 1600

const signed = (t: number) => {
  const r = Math.round(t)
  return r > 0 ? `+${r}°` : `${r}°`
}

export function printCaption(frame: Frame): { title: string; subtitle: string } {
  const film = FILMS[frame.film]
  const title = `Кадр №${frame.number}${frame.intention ? ` — ${frame.intention}` : ''}`
  const parts = [film.name, formatDuration(frame.fogged ? frame.developedMs : frame.durationMs), formatDate(frame.finishedAt)]
  if (frame.weather) parts.push(`${frame.weather.label}, ${signed(frame.weather.temperature)}`)
  return { title, subtitle: parts.join(' · ') }
}

export const printFileName = (f: Frame) => `proyavka-kadr-${String(f.number).padStart(3, '0')}.png`

// Small cache so a share right after a download (or after prewarm on hover) doesn't re-render,
// and so `navigator.share()` is called while the click's user activation is still valid.
const cache = new Map<string, Promise<Blob>>()
const keyOf = (f: Frame) => `${f.id}:${f.number}:${f.peeks}:${f.fogged}:${f.intention}`

export function printBlob(frame: Frame): Promise<Blob> {
  const key = keyOf(frame)
  let p = cache.get(key)
  if (!p) {
    p = exportFramePNG(
      { seed: frame.seed, film: frame.film, weather: frame.weather, hour: frame.hour, peeks: frame.peeks, fogged: frame.fogged },
      printCaption(frame),
      PRINT_SIZE,
    )
    p.catch(() => cache.delete(key))
    if (cache.size > 4) cache.delete(cache.keys().next().value as string)
    cache.set(key, p)
  }
  return p
}

/** Start rendering the print in the background (e.g. on hover/focus of a share button). */
export function prewarmPrint(frame: Frame): void {
  void printBlob(frame).catch(() => {})
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function downloadPrint(frame: Frame): Promise<string> {
  const name = printFileName(frame)
  downloadBlob(await printBlob(frame), name)
  return name
}

export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled'

/**
 * Share the print via the Web Share API (files), falling back to a download when the browser
 * can't share files or refuses (e.g. user activation expired while rendering).
 */
export async function sharePrint(frame: Frame): Promise<ShareOutcome> {
  const blob = await printBlob(frame)
  const name = printFileName(frame)
  const file = new File([blob], name, { type: 'image/png' })
  const minutes = formatDuration(frame.developedMs)
  const data: ShareData = {
    files: [file],
    title: `Проявка — кадр №${frame.number}`,
    text: frame.intention ? `«${frame.intention}» — ${minutes} без экрана.` : `${minutes} без экрана.`,
  }
  if (typeof navigator.share === 'function' && navigator.canShare?.(data)) {
    try {
      await navigator.share(data)
      return 'shared'
    } catch (e) {
      const name = (e as DOMException)?.name
      if (name === 'AbortError') return 'cancelled'
      if (name !== 'NotAllowedError' && name !== 'DataError') throw e
    }
  }
  downloadBlob(blob, name)
  return 'downloaded'
}
