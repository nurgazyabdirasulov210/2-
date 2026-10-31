import type { Ctx } from '../canvas'
import { fbm, ridged, type Noise2D } from '../noise'
import type { Rng } from '../rng'
import { css, type RGB } from '../util'

export type Pt = [number, number]

/** Polyline across the frame: y = base - amp * shape(x). */
export function ridgeLine(
  noise: Noise2D,
  opts: { base: number; amp: number; freq: number; off: number; oct?: number; ridge?: boolean; step?: number; tilt?: number },
): Pt[] {
  const pts: Pt[] = []
  const step = opts.step ?? 0.004
  for (let x = -0.02; x <= 1.02 + 1e-9; x += step) {
    const v = opts.ridge
      ? ridged(noise, x * opts.freq + opts.off, opts.off * 0.37, opts.oct ?? 5)
      : fbm(noise, x * opts.freq + opts.off, opts.off * 0.61, opts.oct ?? 3) * 0.5 + 0.5
    pts.push([x, opts.base - opts.amp * v + (opts.tilt ?? 0) * (x - 0.5)])
  }
  return pts
}

export function fillUnder(ctx: Ctx, pts: Pt[], bottom: number, style: string | CanvasGradient): void {
  ctx.beginPath()
  ctx.moveTo(pts[0][0], bottom)
  for (const [x, y] of pts) ctx.lineTo(x, y)
  ctx.lineTo(pts[pts.length - 1][0], bottom)
  ctx.closePath()
  ctx.fillStyle = style
  ctx.fill()
}

export function pathUnder(ctx: Ctx, pts: Pt[], bottom: number): void {
  ctx.beginPath()
  ctx.moveTo(pts[0][0], bottom)
  for (const [x, y] of pts) ctx.lineTo(x, y)
  ctx.lineTo(pts[pts.length - 1][0], bottom)
  ctx.closePath()
}

export function yAt(pts: Pt[], x: number): number {
  const step = pts[1][0] - pts[0][0]
  const i = Math.max(0, Math.min(pts.length - 2, Math.floor((x - pts[0][0]) / step)))
  const t = (x - pts[i][0]) / step
  return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t
}

/** Soft radial glow. */
export function glowDot(ctx: Ctx, x: number, y: number, r: number, c: RGB, a: number, core = 0.15): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, css(c, a))
  g.addColorStop(core, css(c, a * 0.55))
  g.addColorStop(0.45, css(c, a * 0.12))
  g.addColorStop(1, css(c, 0))
  ctx.fillStyle = g
  ctx.fillRect(x - r, y - r, r * 2, r * 2)
}

export function stars(ctx: Ctx, glow: Ctx, rng: Rng, top: number, bottom: number, count: number, px: number, tint: RGB[] = [[255, 255, 255]]): void {
  for (let i = 0; i < count; i++) {
    const x = rng.float()
    const y = top + (bottom - top) * Math.pow(rng.float(), 1.25)
    const m = Math.pow(rng.float(), 5)
    const fade = 1 - Math.max(0, (y - top) / (bottom - top)) * 0.6
    const c = rng.pick(tint)
    const a = (0.25 + 0.75 * m) * fade
    const r = Math.max(px * 0.6, (0.0006 + m * 0.0022))
    ctx.fillStyle = css(c, a)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    if (m > 0.35) {
      glowDot(glow, x, y, 0.006 + m * 0.014, c, 0.6 * m * fade)
    }
  }
}
