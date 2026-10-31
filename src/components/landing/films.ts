import { FILM_LIST } from '../../engine'
import type { Film, FilmId, FrameParams } from '../../types'

// Mirrors docs/SPEC.md — used only until/if the engine list is empty.
const FALLBACK: Film[] = [
  { id: 'portra', name: 'Портра 400', short: 'PORTRA 400', description: 'Тёплый пейзаж: холмы, солнце, дымка', swatch: ['#F2C14E', '#FF8A5B', '#6B4A3A'] },
  { id: 'ilford', name: 'Ильфорд HP5', short: 'ILFORD HP5', description: 'Чёрно-белый горизонт, контраст и зерно', swatch: ['#EDEAE3', '#7E8296', '#16171D'] },
  { id: 'cyan', name: 'Цианотипия', short: 'CYANOTYPE', description: 'Синий отпечаток листьев и трав', swatch: ['#E8EEF5', '#3A6EA5', '#0F2747'] },
  { id: 'cinestill', name: 'Синестилл 800', short: 'CINESTILL 800T', description: 'Ночь, неон и ореолы городских огней', swatch: ['#FF5A4E', '#3BC4D9', '#0B0D14'] },
  { id: 'polaroid', name: 'Полароид', short: 'POLAROID 600', description: 'Пастель, мягкие формы, выцветание', swatch: ['#F7D9C4', '#B8D8D0', '#C9B6E4'] },
  { id: 'aurora', name: 'Северное сияние', short: 'AURORA', description: 'Ленты света над горами и звёздами', swatch: ['#5ED6B0', '#C38BFF', '#0B1A2E'] },
]

export function films(): Film[] {
  // One entry per film id, engine metadata preferred (robust while the engine is partially filled).
  return FALLBACK.map((fb) => FILM_LIST.find((f) => f?.id === fb.id) ?? fb)
}

export function filmById(id: FilmId): Film {
  return films().find((f) => f.id === id) ?? FALLBACK.find((f) => f.id === id)!
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
