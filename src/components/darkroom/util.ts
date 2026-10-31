// Small helpers shared by darkroom components.
import { useEffect, useRef, useState } from 'react'
import { FILMS } from '../../engine'
import type { Film, FilmId, Frame, FrameParams } from '../../types'

export function filmOf(id: FilmId): Film {
  return FILMS[id]
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
    if (!enabled) return
    const schedule = () => {
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setIdle(true), ms)
    }
    const arm = () => {
      setIdle(false)
      schedule()
    }
    schedule()
    const evs = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const
    evs.forEach((e) => window.addEventListener(e, arm, { passive: true }))
    return () => {
      window.clearTimeout(timer.current)
      evs.forEach((e) => window.removeEventListener(e, arm))
    }
  }, [ms, enabled])
  return enabled && idle
}

export function signedTemp(t: number): string {
  const r = Math.round(t)
  return r > 0 ? `+${r}°` : `${r}°`
}

/** Darkroom-red ink used for text under the safelight. */
export const SAFE_INK = 'rgba(255, 128, 110, 0.82)'
export const SAFE_INK_DIM = 'rgba(255, 110, 95, 0.5)'
