// Generative film engine — PUBLIC CONTRACT (implementation owned by the engine agent).
import type { Film, FilmId, FrameParams } from '../types'

export const FILMS: Record<FilmId, Film> = {} as Record<FilmId, Film> // filled by engine agent
export const FILM_LIST: Film[] = []

/**
 * Render a frame onto a canvas.
 * @param ctx 2D context; draws into the full canvas size (any aspect, designed for 4:5 portrait)
 * @param params deterministic params
 * @param progress development 0..1 (0 = blank paper, 1 = fully developed).
 *   Must look like chemical development: highlights appear first, contrast builds, slight wet sheen until ~0.9.
 */
export function renderFrame(_ctx: CanvasRenderingContext2D, _params: FrameParams, _progress: number): void {
  throw new Error('not implemented')
}

/** Export frame as PNG Blob in a print-style white border with caption. */
export async function exportFramePNG(_params: FrameParams, _caption: { title: string; subtitle: string }, _size?: number): Promise<Blob> {
  throw new Error('not implemented')
}
