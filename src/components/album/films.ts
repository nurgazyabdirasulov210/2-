// Film metadata with a local fallback while/if the engine table is empty.
import { FILMS } from '../../engine'
import type { Film, FilmId, Frame, FrameParams } from '../../types'

export const FILM_IDS: FilmId[] = ['portra', 'ilford', 'cyan', 'cinestill', 'polaroid', 'aurora']

const FALLBACK: Record<FilmId, Film> = {
  portra: { id: 'portra', name: 'Портра 400', short: 'PORTRA 400', description: 'Тёплый пейзаж, дымка', swatch: ['#F1C27D', '#D9825B', '#7D8F69'] },
  ilford: { id: 'ilford', name: 'Ильфорд HP5', short: 'HP5 PLUS 400', description: 'Ч/б, высокий контраст', swatch: ['#EDEDED', '#8C8C8C', '#262626'] },
  cyan: { id: 'cyan', name: 'Цианотипия', short: 'CYANOTYPE', description: 'Синий отпечаток', swatch: ['#E6EEF3', '#3F72A8', '#14325A'] },
  cinestill: { id: 'cinestill', name: 'Синестилл 800', short: 'CINESTILL 800T', description: 'Ночь, неон, ореолы', swatch: ['#FF5E57', '#3CB6C8', '#171B30'] },
  polaroid: { id: 'polaroid', name: 'Полароид', short: 'POLAROID 600', description: 'Пастель, выцветание', swatch: ['#F5D3C6', '#B6D7CF', '#E6C07B'] },
  aurora: { id: 'aurora', name: 'Северное сияние', short: 'AURORA 1600', description: 'Ленты света над горами', swatch: ['#5ED6B0', '#6AA8FF', '#1C2140'] },
}

export function getFilm(id: FilmId): Film {
  const f = (FILMS as Partial<Record<FilmId, Film>>)?.[id]
  return f && f.name ? f : FALLBACK[id]
}

export function frameParams(f: Frame): FrameParams {
  return { seed: f.seed, film: f.film, weather: f.weather, hour: f.hour, peeks: f.peeks, fogged: f.fogged }
}

/** «12», «12A»-style edge numbers. */
export function edgeNumber(n: number): string {
  return String(n).padStart(2, '0')
}

const MONTHS_NOM = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
const MONTHS_PREP = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре']
export const monthName = (m: number) => MONTHS_NOM[m]
export const monthPrep = (m: number) => MONTHS_PREP[m]
