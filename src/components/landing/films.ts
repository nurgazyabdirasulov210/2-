import { FILMS, FILM_LIST } from '../../engine'
import type { Film, FilmId, FrameParams } from '../../types'

/** All films in display order — the engine is the single source of truth. */
export function films(): Film[] {
  return FILM_LIST
}

export function filmById(id: FilmId): Film {
  return FILMS[id]
}

/** Curated seeds that look good per film (stable for screenshots). */
export const HERO_SEEDS: { film: FilmId; seed: number; hour: number }[] = [
  { film: 'portra', seed: 412907, hour: 18 },
  { film: 'aurora', seed: 88231, hour: 23 },
  { film: 'cinestill', seed: 50213, hour: 22 },
  { film: 'cyan', seed: 77104, hour: 12 },
  { film: 'ilford', seed: 31337, hour: 9 },
  { film: 'polaroid', seed: 24601, hour: 16 },
]

export function demoParams(film: FilmId, seed: number, hour = 17, peeks = 0, fogged = false): FrameParams {
  return { film, seed, hour, peeks, fogged, weather: null }
}
