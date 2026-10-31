import type { FilmId } from '../../types'
import type { FilmImpl } from '../types'
import { cinestill } from './cinestill'
import { cyan } from './cyan'
import { ilford } from './ilford'
import { portra } from './portra'

export const FILM_IMPLS: Record<FilmId, FilmImpl> = {
  portra,
  ilford,
  cyan,
  cinestill,
  polaroid: portra,
  aurora: portra,
}

export const FILM_ORDER: FilmId[] = ['portra', 'ilford', 'cyan', 'cinestill', 'polaroid', 'aurora']
