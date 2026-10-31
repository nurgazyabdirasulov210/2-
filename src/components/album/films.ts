// Album helpers around engine film metadata.
import { FILMS, FILM_LIST } from '../../engine'
import type { Film, FilmId, Frame, FrameParams } from '../../types'

export const FILM_IDS: FilmId[] = FILM_LIST.map((f) => f.id)

/** Film metadata — the engine is the single source of truth. */
export function getFilm(id: FilmId): Film {
  return FILMS[id]
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
