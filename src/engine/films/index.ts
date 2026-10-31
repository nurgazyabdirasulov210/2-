import type { FilmId } from '../../types'
import type { FilmImpl } from '../types'
import { aurora } from './aurora'
import { cinestill } from './cinestill'
import { cyan } from './cyan'
import { ilford } from './ilford'
import { polaroid } from './polaroid'
import { portra } from './portra'

export const FILM_IMPLS: Record<FilmId, FilmImpl> = { portra, ilford, cyan, cinestill, polaroid, aurora }

export const FILM_ORDER: FilmId[] = ['portra', 'ilford', 'cyan', 'cinestill', 'polaroid', 'aurora']
