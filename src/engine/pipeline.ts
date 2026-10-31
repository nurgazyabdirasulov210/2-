// Builds the fully developed frame (cached) and applies the darkroom development transform.
import type { FilmId, FrameParams } from '../types'
import { createSurface, type Ctx } from './canvas'
import { deriveEnv } from './env'
import { FILM_IMPLS } from './films'
import { createNoise2D, fbm } from './noise'
import { applyBloom, applySoften, drawLeaks, drawWeather, gradePass, type Developed } from './post'
import { hashString, mixSeed, Rng } from './rng'
import { clamp, smoothstep } from './util'

export interface BuiltFrame extends Developed {
  film: FilmId
  paper: [number, number, number]
  devTone: [number, number, number]
  devMono: number
  sheenSeed: number
  out: ImageData | null
}

export function paramsKey(p: FrameParams, w: number, h: number): string {
  const wt = p.weather
  const wk = wt ? `${wt.temperature}|${wt.weatherCode}|${wt.cloudCover}|${wt.precipitation}|${wt.isDay ? 1 : 0}|${wt.windSpeed}` : '-'
  return `${p.film}|${p.seed}|${p.hour}|${p.peeks}|${p.fogged ? 1 : 0}|${wk}|${w}x${h}`
}

export function buildFrame(params: FrameParams, w: number, h: number): BuiltFrame {
  const impl = FILM_IMPLS[params.film] ?? FILM_IMPLS.portra
  const seed = mixSeed(params.seed >>> 0, hashString(params.film))
  const env = deriveEnv(params)
  const rng = new Rng(seed)
  const main = createSurface(w, h)
  const glow = createSurface(w, h)
  glow.ctx.fillStyle = '#000'
  glow.ctx.fillRect(0, 0, glow.w, glow.h)
  const H = main.h / main.w
  main.ctx.setTransform(main.w, 0, 0, main.w, 0, 0)
  glow.ctx.setTransform(main.w, 0, 0, main.w, 0, 0)
  impl.draw({
    ctx: main.ctx,
    glow: glow.ctx,
    W: 1,
    H,
    px: 1 / main.w,
    pw: main.w,
    rng: rng.fork('scene'),
    noise: createNoise2D(mixSeed(seed, 77)),
    env,
    })
  main.ctx.setTransform(1, 0, 0, 1, 0, 0)
  glow.ctx.setTransform(1, 0, 0, 1, 0, 0)
  main.ctx.globalAlpha = 1
  main.ctx.globalCompositeOperation = 'source-over'
  applyBloom(main, glow, impl.bloom(env))
  drawWeather(main, env, rng.fork('weather'), impl.precipTone ?? [235, 240, 245])
  const grade = impl.grade(env, rng.fork('grade'))
  applySoften(main, grade)
  drawLeaks(main, params, new Rng(mixSeed(params.seed >>> 0, 0x1ea4)))
  const dn = createNoise2D(mixSeed(seed, 991))
  const dev = gradePass(main, grade, seed, (u, v) => fbm(dn, u * 3.2, v * 3.2, 3))
  normalizeDev(dev)
  return {
    ...dev,
    film: impl.meta.id,
    paper: impl.paper,
    devTone: impl.devTone,
    devMono: impl.devMono,
    sheenSeed: seed,
    out: null,
  }
}

/** Stretch the development order to the frame's own tonal range (2%..98%). */
function normalizeDev(d: Developed): void {
  const hist = new Uint32Array(256)
  const n = d.dev.length
  for (let i = 0; i < n; i++) hist[d.dev[i]]++
  let acc = 0
  let lo = 0
  let hi = 255
  for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc >= n * 0.02) { lo = i; break } }
  acc = 0
  for (let i = 255; i >= 0; i--) { acc += hist[i]; if (acc >= n * 0.02) { hi = i; break } }
  if (hi - lo < 16) return
  const map = new Uint8Array(256)
  for (let i = 0; i < 256; i++) map[i] = clamp((i - lo) / (hi - lo)) * 255
  for (let i = 0; i < n; i++) d.dev[i] = map[d.dev[i]]
}

// --- cache ---------------------------------------------------------------
const CACHE_MAX = 8
const cache = new Map<string, BuiltFrame>()

export function getFrame(params: FrameParams, w: number, h: number): BuiltFrame {
  const key = paramsKey(params, w, h)
  const hit = cache.get(key)
  if (hit) {
    cache.delete(key)
    cache.set(key, hit)
    return hit
  }
  const f = buildFrame(params, w, h)
  cache.set(key, f)
  while (cache.size > CACHE_MAX) {
    const first = cache.keys().next().value
    if (first === undefined) break
    cache.delete(first)
  }
  return f
}

export function clearCache(): void {
  cache.clear()
}

// --- development ---------------------------------------------------------
const alphaLut = new Float32Array(256)

/** Write the developed-at-`progress` image into `out` (RGBA). */
export function developInto(f: BuiltFrame, progress: number, out: Uint8ClampedArray): void {
  const p = clamp(progress)
  const n = f.w * f.h
  if (p >= 1) {
    out.set(f.data)
    return
  }
  // darks start early, highlights late; each tone takes ~0.5 of the bath to reach full density
  for (let i = 0; i < 256; i++) {
    const start = 0.02 + 0.42 * Math.pow(i / 255, 1.2)
    alphaLut[i] = smoothstep(start, start + 0.5, p)
  }
  const colorT = smoothstep(0.3, 0.98, p)
  const mono = f.devMono * (1 - colorT)
  const [pr, pg, pb] = f.paper
  const [tr, tg, tb] = f.devTone
  const d = f.data
  const lum = f.lum
  const dev = f.dev
  for (let i = 0, k = 0; i < n; i++, k += 4) {
    const a = alphaLut[dev[i]]
    if (a <= 0) {
      out[k] = pr; out[k + 1] = pg; out[k + 2] = pb; out[k + 3] = 255
      continue
    }
    const L = lum[i] / 255
    // partially developed silver reads as a warm monochrome
    let r = d[k] + (L * tr - d[k]) * mono
    let g = d[k + 1] + (L * tg - d[k + 1]) * mono
    let b = d[k + 2] + (L * tb - d[k + 2]) * mono
    r = pr + (r - pr) * a
    g = pg + (g - pg) * a
    b = pb + (b - pb) * a
    out[k] = r; out[k + 1] = g; out[k + 2] = b; out[k + 3] = 255
  }
}

/** Wet glossy sheen of a print still in the tray. */
export function drawSheen(ctx: Ctx, w: number, h: number, progress: number, seed: number): void {
  const wet = 1 - smoothstep(0.82, 0.97, progress)
  if (wet <= 0.001) return
  const r = new Rng(mixSeed(seed, 0x5ee))
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalCompositeOperation = 'screen'
  const ang = r.range(-0.5, 0.5)
  const x0 = w * (0.5 + Math.cos(ang + 2.4) * 0.9)
  const y0 = h * (0.5 + Math.sin(ang + 2.4) * 0.9)
  const x1 = w * (0.5 - Math.cos(ang + 2.4) * 0.9)
  const y1 = h * (0.5 - Math.sin(ang + 2.4) * 0.9)
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  const c = r.range(0.32, 0.45)
  g.addColorStop(0, `rgba(255,255,255,${0.16 * wet})`)
  g.addColorStop(c - 0.12, `rgba(255,255,255,${0.02 * wet})`)
  g.addColorStop(c - 0.02, `rgba(255,255,255,${0.13 * wet})`)
  g.addColorStop(c, `rgba(255,255,255,${0.2 * wet})`)
  g.addColorStop(c + 0.05, `rgba(255,255,255,${0.03 * wet})`)
  g.addColorStop(0.75, `rgba(255,255,255,0)`)
  g.addColorStop(1, `rgba(255,255,255,${0.06 * wet})`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  // liquid pooling at the lower edge
  ctx.globalCompositeOperation = 'multiply'
  const g2 = ctx.createLinearGradient(0, h * 0.82, 0, h)
  g2.addColorStop(0, 'rgba(255,255,255,0)')
  g2.addColorStop(1, `rgba(200,196,190,${0.35 * wet})`)
  ctx.fillStyle = g2
  ctx.fillRect(0, h * 0.8, w, h * 0.2)
  ctx.restore()
}
