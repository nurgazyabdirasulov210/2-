// Generative film engine — PUBLIC CONTRACT.
import type { Film, FilmId, FrameParams } from '../types'
import { FILM_IMPLS, FILM_ORDER } from './films'
import { developInto, drawSheen, getFrame } from './pipeline'

export { exportFramePNG } from './export'
export { clearCache as clearEngineCache } from './pipeline'

export const FILMS: Record<FilmId, Film> = Object.fromEntries(
  FILM_ORDER.map((id) => [id, FILM_IMPLS[id].meta]),
) as Record<FilmId, Film>
export const FILM_LIST: Film[] = FILM_ORDER.map((id) => FILMS[id])

/**
 * Render a frame onto a canvas.
 * @param ctx 2D context; draws into the full canvas size (any aspect, designed for 4:5 portrait)
 * @param params deterministic params
 * @param progress development 0..1 (0 = blank paper, 1 = fully developed).
 *   Emulates a positive darkroom print: dark tones emerge first, contrast and colour build,
 *   wet glossy sheen until ~0.95. The fully developed image is cached per (params, size),
 *   so re-rendering for a new progress value only costs one per-pixel pass.
 */
export function renderFrame(ctx: CanvasRenderingContext2D, params: FrameParams, progress: number): void {
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  if (w < 1 || h < 1) return
  const f = getFrame(params, w, h)
  if (!f.out || f.out.width !== w || f.out.height !== h) f.out = ctx.createImageData(w, h)
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0
  developInto(f, p, f.out.data)
  ctx.putImageData(f.out, 0, 0)
  drawSheen(ctx, w, h, p, f.sheenSeed)
}
