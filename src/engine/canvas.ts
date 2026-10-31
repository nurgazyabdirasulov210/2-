// Canvas helpers that work with OffscreenCanvas (preferred) or DOM canvas.
import { clamp } from './util'

export type Ctx = CanvasRenderingContext2D
export type AnyCanvas = HTMLCanvasElement | OffscreenCanvas

export interface Surface {
  canvas: AnyCanvas
  ctx: Ctx
  w: number
  h: number
}

export function createSurface(w: number, h: number): Surface {
  const W = Math.max(1, Math.round(w))
  const H = Math.max(1, Math.round(h))
  let canvas: AnyCanvas
  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(W, H)
  } else {
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    canvas = c
  }
  const ctx = canvas.getContext('2d') as unknown as Ctx
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  return { canvas, ctx, w: W, h: H }
}

/** Cheap, smooth large-radius blur: pyramid down then back up with bilinear filtering. */
export function blurSurface(src: Surface, radiusPx: number): Surface {
  const levels = clamp(Math.round(Math.log2(Math.max(1, radiusPx))) + 1, 1, 9)
  const chain: Surface[] = []
  let cur: Surface = src
  for (let i = 0; i < levels; i++) {
    const s = createSurface(Math.max(1, Math.ceil(cur.w / 2)), Math.max(1, Math.ceil(cur.h / 2)))
    s.ctx.drawImage(cur.canvas, 0, 0, s.w, s.h)
    chain.push(s)
    cur = s
  }
  for (let i = chain.length - 2; i >= 0; i--) {
    const t = chain[i]
    t.ctx.clearRect(0, 0, t.w, t.h)
    t.ctx.drawImage(cur.canvas, 0, 0, t.w, t.h)
    cur = t
  }
  const out = createSurface(src.w, src.h)
  out.ctx.drawImage(cur.canvas, 0, 0, out.w, out.h)
  return out
}

/**
 * Evaluate a per-pixel function on a low resolution grid and return it as a surface
 * (straight alpha). `fn(u, v, out)` gets unit coords u∈[0,1], v∈[0,H] and writes 0..1 RGBA into out.
 */
export function fieldSurface(
  resW: number,
  resH: number,
  H: number,
  fn: (u: number, v: number, out: Float32Array) => void,
  y0 = 0,
  y1 = H,
): Surface {
  const s = createSurface(resW, resH)
  const img = s.ctx.createImageData(s.w, s.h)
  const d = img.data
  const out = new Float32Array(4)
  for (let j = 0; j < s.h; j++) {
    const v = y0 + ((j + 0.5) / s.h) * (y1 - y0)
    for (let i = 0; i < s.w; i++) {
      const u = (i + 0.5) / s.w
      out[0] = out[1] = out[2] = 0
      out[3] = 1
      fn(u, v, out)
      const k = (j * s.w + i) * 4
      d[k] = out[0] * 255
      d[k + 1] = out[1] * 255
      d[k + 2] = out[2] * 255
      d[k + 3] = out[3] * 255
    }
  }
  s.ctx.putImageData(img, 0, 0)
  return s
}
