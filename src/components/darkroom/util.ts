// Small helpers shared by darkroom components.
import { useEffect, useRef, useState } from 'react'
import { FILMS, FILM_LIST } from '../../engine'
import type { Film, FilmId, Frame, FrameParams } from '../../types'

const FALLBACK_FILM = (id: FilmId): Film => ({
  id,
  name: id,
  short: id.toUpperCase(),
  description: '',
  swatch: ['#EFE9DF', '#A9ABB8', '#1B1A17'],
})

export function filmOf(id: FilmId): Film {
  return FILMS[id] ?? FILM_LIST.find((f) => f.id === id) ?? FALLBACK_FILM(id)
}

export function randomSeed(): number {
  try {
    const a = new Uint32Array(1)
    crypto.getRandomValues(a)
    return a[0]
  } catch {
    return Math.floor(Math.random() * 0xffffffff) >>> 0
  }
}

export function frameParams(f: Frame): FrameParams {
  return { seed: f.seed, film: f.film, weather: f.weather, hour: f.hour, peeks: f.peeks, fogged: f.fogged }
}

/** true after `ms` without pointer / key / touch / wheel activity. */
export function useIdle(ms: number, enabled = true): boolean {
  const [idle, setIdle] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (!enabled) {
      setIdle(false)
      return
    }
    const arm = () => {
      window.clearTimeout(timer.current)
      setIdle(false)
      timer.current = window.setTimeout(() => setIdle(true), ms)
    }
    arm()
    const evs = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const
    evs.forEach((e) => window.addEventListener(e, arm, { passive: true }))
    return () => {
      window.clearTimeout(timer.current)
      evs.forEach((e) => window.removeEventListener(e, arm))
    }
  }, [ms, enabled])
  return idle
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function signedTemp(t: number): string {
  const r = Math.round(t)
  return r > 0 ? `+${r}°` : `${r}°`
}

/** Darkroom-red ink used for text under the safelight. */
export const SAFE_INK = 'rgba(255, 128, 110, 0.82)'
export const SAFE_INK_DIM = 'rgba(255, 110, 95, 0.5)'
