// Shared post-processing: bloom/halation, weather overlays, light leaks, film grade + grain.
import type { FrameParams } from '../types'
import { blurSurface, createSurface, type Surface } from './canvas'
import type { Env } from './env'
import { hash2, Rng } from './rng'
import type { BloomPass, Grade } from './types'
import { clamp, css, type RGB } from './util'

export function applyBloom(main: Surface, glow: Surface, passes: BloomPass[]): void {
  for (const p of passes) {
    if (p.strength <= 0) continue
    const b = blurSurface(glow, p.radius * main.w)
    if (p.mono) {
      b.ctx.globalCompositeOperation = 'saturation'
      b.ctx.fillStyle = '#808080'
      b.ctx.fillRect(0, 0, b.w, b.h)
    }
    b.ctx.globalCompositeOperation = 'multiply'
    b.ctx.fillStyle = css(p.tint)
    b.ctx.fillRect(0, 0, b.w, b.h)
    main.ctx.save()
    main.ctx.globalCompositeOperation = 'screen'
    let s = p.strength
    while (s > 0.001) {
      main.ctx.globalAlpha = Math.min(1, s)
      main.ctx.drawImage(b.canvas, 0, 0)
      s -= 1
    }
    main.ctx.restore()
  }
}

/** Rain streaks, lens droplets, snow flakes, fog veil. Drawn in unit coords (ctx already scaled). */
export function drawWeather(main: Surface, env: Env, rng: Rng, tone: RGB): void {
  const ctx = main.ctx
  const H = main.h / main.w
  const px = 1 / main.w
  ctx.save()
  ctx.setTransform(main.w, 0, 0, main.w, 0, 0)
  if (env.fog > 0) {
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, css([220, 222, 222], 0.18 * env.fog))
    g.addColorStop(0.55, css([230, 230, 228], 0.42 * env.fog))
    g.addColorStop(1, css([225, 225, 222], 0.22 * env.fog))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 1, H)
  }
  if (env.rain > 0) {
    const r = rng.fork('rain')
    const ang = 0.08 + env.wind * 0.35
    const n = Math.round(260 + env.rain * 900)
    ctx.lineCap = 'round'
    for (let i = 0; i < n; i++) {
      const x = r.range(-0.1, 1.1)
      const y = r.range(-0.1, H)
      const depth = r.float()
      const len = (0.015 + depth * 0.06) * (0.7 + env.rain * 0.5)
      ctx.strokeStyle = css(tone, (0.05 + depth * 0.16) * (0.6 + env.rain * 0.4))
      ctx.lineWidth = Math.max(px * 0.8, (0.0006 + depth * 0.0016))
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x - Math.sin(ang) * len, y + Math.cos(ang) * len)
      ctx.stroke()
    }
    // droplets on the lens
    const drops = Math.round(6 + env.rain * 22)
    for (let i = 0; i < drops; i++) {
      const x = r.float()
      const y = r.range(0, H)
      const rad = r.range(0.004, 0.018) * (r.chance(0.15) ? 2 : 1)
      const g = ctx.createRadialGradient(x - rad * 0.3, y - rad * 0.35, rad * 0.05, x, y, rad)
      g.addColorStop(0, css([255, 255, 255], 0.35))
      g.addColorStop(0.35, css(tone, 0.08))
      g.addColorStop(0.85, css([0, 0, 0], 0.12))
      g.addColorStop(1, css([0, 0, 0], 0))
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.ellipse(x, y, rad, rad * 1.08, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  if (env.snow > 0) {
    const r = rng.fork('snow')
    const n = Math.round(180 + env.snow * 700)
    for (let i = 0; i < n; i++) {
      const x = r.float()
      const y = r.range(0, H)
      const depth = Math.pow(r.float(), 2.2)
      const rad = 0.0012 + depth * 0.012
      const blur = depth > 0.55
      const a = (0.35 + 0.5 * (1 - depth)) * (blur ? 0.45 : 0.9)
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
      g.addColorStop(0, css([255, 255, 255], a))
      g.addColorStop(blur ? 0.5 : 0.6, css([250, 252, 255], a * 0.75))
      g.addColorStop(1, css([255, 255, 255], 0))
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, rad, 0, Math.PI * 2)
      ctx.fill()
    }
    const veil = ctx.createLinearGradient(0, 0, 0, H)
    veil.addColorStop(0, css([235, 238, 242], 0.06 * env.snow))
    veil.addColorStop(1, css([240, 242, 245], 0.14 * env.snow))
    ctx.fillStyle = veil
    ctx.fillRect(0, 0, 1, H)
  }
  ctx.restore()
}

const LEAK_COLORS: RGB[][] = [
  [[255, 246, 214], [255, 170, 70], [240, 70, 30]],
  [[255, 236, 190], [255, 120, 50], [200, 30, 40]],
  [[255, 250, 225], [255, 196, 90], [255, 90, 40]],
  [[255, 228, 200], [250, 110, 80], [180, 30, 80]],
]

function drawLeak(ctx: CanvasRenderingContext2D, r: Rng, H: number, strength: number): void {
  const side = r.int(0, 3)
  const t = r.range(0.1, 0.9)
  const pal = r.pick(LEAK_COLORS)
  let cx = 0
  let cy = 0
  if (side === 0) { cx = -0.05; cy = t * H } else if (side === 1) { cx = 1.05; cy = t * H } else if (side === 2) { cx = t; cy = -0.05 } else { cx = t; cy = H + 0.05 }
  const rad = r.range(0.35, 0.75) * (0.8 + strength * 0.4)
  const sx = side < 2 ? r.range(0.5, 0.9) : r.range(1.2, 2.2)
  const sy = side < 2 ? r.range(1.2, 2.4) : r.range(0.5, 0.9)
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(sx, sy)
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rad)
  const a = clamp(strength)
  g.addColorStop(0, css(pal[0], 0.95 * a))
  g.addColorStop(0.18, css(pal[1], 0.8 * a))
  g.addColorStop(0.5, css(pal[2], 0.42 * a))
  g.addColorStop(1, css(pal[2], 0))
  ctx.fillStyle = g
  ctx.fillRect(-rad, -rad, rad * 2, rad * 2)
  ctx.restore()
  // thin hot streak along the film edge
  if (r.chance(0.6)) {
    const vertical = side < 2
    const pos = side === 1 || side === 3 ? r.range(0.9, 1.0) : r.range(0.0, 0.1)
    const lw = r.range(0.02, 0.08)
    const g2 = vertical
      ? ctx.createLinearGradient(pos * 1 - lw, 0, pos * 1 + lw, 0)
      : ctx.createLinearGradient(0, pos * H - lw, 0, pos * H + lw)
    g2.addColorStop(0, css(pal[2], 0))
    g2.addColorStop(0.5, css(pal[1], 0.5 * a))
    g2.addColorStop(1, css(pal[2], 0))
    ctx.fillStyle = g2
    ctx.fillRect(0, 0, 1, H)
  }
}

export function drawLeaks(main: Surface, params: FrameParams, rng: Rng): void {
  const ctx = main.ctx
  const H = main.h / main.w
  ctx.save()
  ctx.setTransform(main.w, 0, 0, main.w, 0, 0)
  ctx.globalCompositeOperation = 'screen'
  const peeks = Math.max(0, Math.floor(params.peeks))
  const n = Math.min(peeks, 7)
  for (let i = 0; i < n; i++) {
    // each peek gets its own stable stream: frames keep earlier leaks as peeks grow
    drawLeak(ctx, rng.fork(`leak${i}`), H, 0.45 + Math.min(peeks, 8) * 0.07)
  }
  if (params.fogged) {
    const r = rng.fork('fog')
    for (let i = 0; i < 3; i++) drawLeak(ctx, r.fork(i), H, 1)
    ctx.globalCompositeOperation = 'source-over'
    const g = ctx.createRadialGradient(r.range(0.2, 0.8), r.range(0.2, 0.8) * H, 0.05, 0.5, H / 2, H)
    g.addColorStop(0, css([255, 244, 226], 0.78))
    g.addColorStop(0.6, css([252, 226, 196], 0.6))
    g.addColorStop(1, css([245, 200, 170], 0.5))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 1, H)
  }
  ctx.restore()
}

/** Optional soft-focus: blurred copy blended on top. */
export function applySoften(main: Surface, g: Grade): void {
  if (g.soften <= 0) return
  const b = blurSurface(main, g.softenRadius * main.w)
  main.ctx.save()
  main.ctx.globalAlpha = g.soften
  main.ctx.drawImage(b.canvas, 0, 0)
  main.ctx.restore()
}

function buildLut(g: Grade, ch: 0 | 1 | 2): Float32Array {
  const lut = new Float32Array(256)
  for (let i = 0; i < 256; i++) {
    let v = i / 255
    v = Math.pow(v, g.gamma[ch])
    v = v + g.contrast * (v * v * (3 - 2 * v) - v)
    v = g.lift[ch] + (g.gain[ch] - g.lift[ch]) * v
    lut[i] = v
  }
  return lut
}

export interface Developed {
  w: number
  h: number
  data: Uint8ClampedArray
  /** development order per pixel: 0 = appears first (dark), 255 = last (light) */
  dev: Uint8Array
  lum: Uint8Array
}

/** Per-pixel grade, vignette and grain. Produces final pixels + development maps. */
export function gradePass(main: Surface, g: Grade, seed: number, devNoise: (u: number, v: number) => number): Developed {
  const { w, h } = main
  const img = main.ctx.getImageData(0, 0, w, h)
  const d = img.data
  const lr = buildLut(g, 0)
  const lg = buildLut(g, 1)
  const lb = buildLut(g, 2)
  const dev = new Uint8Array(w * h)
  const lum = new Uint8Array(w * h)
  // coarse development-unevenness grid
  const GW = 48
  const GH = Math.max(2, Math.round((GW * h) / w))
  const grid = new Float32Array((GW + 1) * (GH + 1))
  for (let j = 0; j <= GH; j++) for (let i = 0; i <= GW; i++) grid[j * (GW + 1) + i] = devNoise(i / GW, (j / GH) * (h / w))

  const s = seed | 0
  const s2 = (seed ^ 0x5bd1e995) | 0
  const grainAmp = g.grain
  const chroma = g.grainChroma
  const clump = g.grainClump
  const sat = g.sat
  const [str, stg, stb] = g.shadowTint
  const [htr, htg, htb] = g.highlightTint
  const [vtr, vtg, vtb] = g.vignetteTint
  const vig = g.vignette
  const cx = w / 2
  const cy = h / 2
  const invR2 = 1 / (cx * cx + cy * cy)
  const mono = g.mono

  for (let y = 0; y < h; y++) {
    const dy = y - cy
    const gy = (y / h) * GH
    const gj = Math.min(GH - 1, Math.floor(gy))
    const fy = gy - gj
    for (let x = 0; x < w; x++) {
      const k = (y * w + x) * 4
      let r: number, gg: number, b: number
      if (mono) {
        const l0 = Math.round(d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11)
        r = lr[l0]; gg = lg[l0]; b = lb[l0]
      } else {
        r = lr[d[k]]; gg = lg[d[k + 1]]; b = lb[d[k + 2]]
        const l = 0.2126 * r + 0.7152 * gg + 0.0722 * b
        r = l + (r - l) * sat
        gg = l + (gg - l) * sat
        b = l + (b - l) * sat
      }
      let l = 0.2126 * r + 0.7152 * gg + 0.0722 * b
      const sh = (1 - l) * (1 - l)
      const hi = l * l
      r += str * sh + htr * hi
      gg += stg * sh + htg * hi
      b += stb * sh + htb * hi
      // vignette
      const dx = x - cx
      const rr = (dx * dx + dy * dy) * invR2
      const vv = vig * rr * rr * 1.6 + vig * rr * 0.35
      const vm = 1 - vv
      r = r * vm + vtr * rr
      gg = gg * vm + vtg * rr
      b = b * vm + vtb * rr
      // grain (triangular distribution, midtone-weighted, optional clumps)
      l = 0.2126 * r + 0.7152 * gg + 0.0722 * b
      const lc = l < 0 ? 0 : l > 1 ? 1 : l
      let n = hash2(x, y, s) + hash2(x + 7, y + 3, s2) - 1
      if (clump > 0) n = n * (1 - clump) + (hash2(x >> 1, y >> 1, s) * 2 - 1) * clump * 1.3
      const amp = grainAmp * (0.35 + 2.4 * lc * (1 - lc))
      const nn = n * amp
      if (chroma > 0) {
        const hc = hash2(x, y, s ^ 0x2f) - 0.5
        const hd = hash2(y, x, s ^ 0x71) - 0.5
        r += nn + hc * amp * chroma
        gg += nn
        b += nn + hd * amp * chroma
      } else {
        r += nn; gg += nn; b += nn
      }
      const R = r < 0 ? 0 : r > 1 ? 255 : r * 255
      const G = gg < 0 ? 0 : gg > 1 ? 255 : gg * 255
      const B = b < 0 ? 0 : b > 1 ? 255 : b * 255
      d[k] = R; d[k + 1] = G; d[k + 2] = B; d[k + 3] = 255
      const L = 0.2126 * R + 0.7152 * G + 0.0722 * B
      const pi = y * w + x
      lum[pi] = L
      // development order: darker first, perturbed by coarse "agitation" noise
      const gx = (x / w) * GW
      const gi = Math.min(GW - 1, Math.floor(gx))
      const fx = gx - gi
      const i0 = gj * (GW + 1) + gi
      const n0 = grid[i0] + (grid[i0 + 1] - grid[i0]) * fx
      const n1 = grid[i0 + GW + 1] + (grid[i0 + GW + 2] - grid[i0 + GW + 1]) * fx
      const dn = n0 + (n1 - n0) * fy
      const dv = L + dn * 34
      dev[pi] = dv < 0 ? 0 : dv > 255 ? 255 : dv
    }
  }
  return { w, h, data: d, dev, lum }
}

