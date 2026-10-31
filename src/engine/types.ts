import type { Film } from '../types'
import type { Ctx } from './canvas'
import type { Env } from './env'
import type { Noise2D } from './noise'
import type { Rng } from './rng'
import type { RGB } from './util'

/** Drawing context handed to each film. Coordinates are in "width units": x∈[0,1], y∈[0,H]. */
export interface Scene {
  ctx: Ctx
  /** Black canvas with the same transform; draw light sources here for bloom / halation. */
  glow: Ctx
  W: 1
  H: number
  /** Pixel size in width units (1 / canvas width). */
  px: number
  /** Canvas pixel width (to choose field resolutions). */
  pw: number
  rng: Rng
  noise: Noise2D
  env: Env
}

export interface Grade {
  mono: boolean
  contrast: number
  lift: RGB
  gain: RGB
  gamma: RGB
  sat: number
  shadowTint: RGB
  highlightTint: RGB
  grain: number
  grainChroma: number
  grainClump: number
  vignette: number
  /** additive vignette tint (edge colour shift), -0.2..0.2 per channel */
  vignetteTint: RGB
  /** soft-focus mix 0..1 (blurred copy on top) */
  soften: number
  /** soft-focus radius in width units */
  softenRadius: number
}

export interface BloomPass {
  /** radius in width units */
  radius: number
  strength: number
  tint: RGB
}

export interface FilmImpl {
  meta: Film
  /** blank (undeveloped) paper colour */
  paper: RGB
  /** colour of partially developed silver image (warm-neutral for prints) */
  devTone: RGB
  /** 0..1 — how monochrome the image looks while developing */
  devMono: number
  draw(s: Scene): void
  grade(env: Env, rng: Rng): Grade
  bloom(env: Env): BloomPass[]
  /** rain/snow streak colour */
  precipTone?: RGB
}

export const baseGrade = (over: Partial<Grade>): Grade => ({
  mono: false,
  contrast: 0.2,
  lift: [0.03, 0.03, 0.03],
  gain: [1, 1, 1],
  gamma: [1, 1, 1],
  sat: 1,
  shadowTint: [0, 0, 0],
  highlightTint: [0, 0, 0],
  grain: 0.06,
  grainChroma: 0.3,
  grainClump: 0.2,
  vignette: 0.3,
  vignetteTint: [0, 0, 0],
  soften: 0,
  softenRadius: 0.004,
  ...over,
})
