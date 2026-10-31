// Северное сияние — aurora curtains over a mountain silhouette, stars, optional lake mirror.
import { blurSurface, createSurface, fieldSurface } from '../canvas'
import { cloudiness } from '../env'
import { fbm, ridged } from '../noise'
import type { Rng } from '../rng'
import { baseGrade, type FilmImpl, type Scene } from '../types'
import { clamp, css, mix, smoothstep, type RGB } from '../util'
import { fillUnder, pathUnder, ridgeLine, stars, yAt, type Pt } from './common'

interface Ribbon { y0: number; amp: number; freq: number; ph: number; L: number; b: number; hue: number }

function pine(ctx: CanvasRenderingContext2D, rng: Rng, x: number, y: number, h: number, c: string): void {
  const tiers = Math.max(4, Math.round(h * 80))
  ctx.fillStyle = c
  ctx.fillRect(x - h * 0.012, y - h * 0.15, h * 0.024, h * 0.15)
  ctx.beginPath()
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers
    const yy = y - h * 0.1 - t * h * 0.9
    const w = h * 0.22 * (1 - t) * rng.range(0.8, 1.15) + h * 0.015
    ctx.moveTo(x - w, yy)
    ctx.lineTo(x, yy - h * 0.16)
    ctx.lineTo(x + w, yy)
  }
  ctx.closePath()
  ctx.fill()
}

function draw(s: Scene): void {
  const { ctx, glow, rng, noise, env, H, pw } = s
  const lake = rng.chance(0.5)
  const horizon = H * (lake ? rng.range(0.55, 0.64) : rng.range(0.62, 0.72))
  const cloud = cloudiness(env, rng.range(0.0, 0.25))
  const twi = env.night ? env.dusk * 0.6 : 0.5 + env.dusk * 0.3

  // ---- sky
  const g = ctx.createLinearGradient(0, 0, 0, horizon)
  g.addColorStop(0, css(mix([3, 6, 16], [18, 30, 64], twi)))
  g.addColorStop(0.7, css(mix([8, 18, 34], [40, 60, 96], twi)))
  g.addColorStop(1, css(mix([16, 34, 46], [90, 90, 120], twi)))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 1, H)
  // milky way band
  if (rng.chance(0.55)) {
    const ox = rng.range(0, 40)
    const ang = rng.range(-0.9, 0.9)
    const cx = rng.range(0.3, 0.7)
    const mw = fieldSurface(Math.round(pw / 4), Math.round((pw / 4) * horizon), H, (u, v, o) => {
      const d = (u - cx) * Math.cos(ang) + (v - horizon * 0.4) * Math.sin(ang)
      const band = Math.exp(-(d * d) / 0.012)
      const n = fbm(noise, u * 6 + ox, v * 6, 5) * 0.5 + 0.5
      const dust = smoothstep(0.45, 0.75, fbm(noise, u * 9 + ox + 7, v * 9, 4) * 0.5 + 0.5)
      const k = band * (0.25 + n * 0.5) * (1 - dust * 0.7)
      o[0] = 0.85; o[1] = 0.82; o[2] = 0.9; o[3] = k * 0.4
    }, 0, horizon)
    ctx.drawImage(mw.canvas, 0, 0, 1, horizon)
  }
  stars(ctx, glow, rng.fork('stars'), 0, horizon, Math.round(700 * (1 - cloud * 0.7)), s.px, [[255, 255, 255], [220, 230, 255], [255, 236, 214]])

  // ---- aurora curtains (additive field)
  const nR = rng.int(2, 3)
  const ribbons: Ribbon[] = []
  for (let i = 0; i < nR; i++) {
    ribbons.push({
      y0: horizon * rng.range(0.45, 0.8) - i * 0.04,
      amp: rng.range(0.12, 0.3),
      freq: rng.range(0.9, 2.4),
      ph: rng.range(0, 50),
      L: rng.range(0.12, 0.32),
      b: rng.range(0.6, 1.1) * (i === 0 ? 1.2 : 1),
      hue: rng.float(),
    })
  }
  const strength = (0.9 + rng.range(0, 0.4)) * (1 - cloud * 0.6) * (env.night ? 1 : 0.65)
  const green: RGB = [70, 255, 160]
  const teal: RGB = [60, 220, 220]
  const mag: RGB = [200, 80, 255]
  const pink: RGB = [255, 90, 160]
  const field = fieldSurface(Math.round(pw / 2.5), Math.round((pw / 2.5) * horizon), H, (u, v, o) => {
    let r = 0
    let gg = 0
    let b = 0
    for (const rb of ribbons) {
      const xw = u + fbm(noise, u * 1.3 + rb.ph, rb.ph * 0.3, 3) * 0.3
      const yb = rb.y0 + rb.amp * fbm(noise, xw * rb.freq + rb.ph, 3.7, 3)
      const dy = yb - v
      if (dy < -0.03 || dy > rb.L * 3) continue
      const above = dy > 0 ? Math.exp(-dy / rb.L) * smoothstep(0, 0.012, dy + 0.004) : Math.exp(dy / 0.04) * 0.22
      const rays = 0.45 + 0.55 * Math.pow(fbm(noise, xw * 55 + rb.ph, v * 1.2, 3) * 0.5 + 0.5, 1.5) * 1.6
      const along = smoothstep(0.25, 0.7, fbm(noise, xw * 2.2 + rb.ph * 2, 1.1, 3) * 0.5 + 0.5)
      const I = above * rays * along * rb.b * strength
      const h = clamp(dy / rb.L)
      let c = h < 0.35 ? mix(green, teal, (h / 0.35) * 0.4) : mix(mix(green, teal, 0.4), mag, smoothstep(0.35, 1, h) * (0.6 + rb.hue * 0.4))
      if (dy < 0.004) c = mix(c, pink, smoothstep(0.004, -0.02, dy) * 0.6)
      r += (c[0] / 255) * I
      gg += (c[1] / 255) * I
      b += (c[2] / 255) * I
    }
    const fade = smoothstep(horizon, horizon * 0.85, v)
    o[0] = clamp(r * fade); o[1] = clamp(gg * fade); o[2] = clamp(b * fade)
  }, 0, horizon)
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.drawImage(field.canvas, 0, 0, 1, horizon)
  ctx.restore()
  glow.save()
  glow.globalCompositeOperation = 'screen'
  glow.globalAlpha = 0.6
  glow.drawImage(field.canvas, 0, 0, 1, horizon)
  glow.restore()
  // thin clouds hiding parts of the sky
  if (cloud > 0.2) {
    const ox = rng.range(0, 30)
    const cl = fieldSurface(Math.round(pw / 5), Math.round((pw / 5) * horizon), H, (u, v, o) => {
      const n = fbm(noise, u * 2.5 + ox, v * 6, 5) * 0.5 + 0.5
      o[0] = 0.05; o[1] = 0.07; o[2] = 0.1
      o[3] = smoothstep(0.65 - cloud * 0.3, 0.85 - cloud * 0.2, n) * 0.85
    }, 0, horizon)
    ctx.drawImage(cl.canvas, 0, 0, 1, horizon)
  }

  // ---- mountains
  const auroraTint: RGB = [40, 120, 100]
  const far = ridgeLine(noise, { base: horizon - 0.005, amp: rng.range(0.2, 0.34), freq: rng.range(1.6, 2.6), off: rng.range(0, 30), oct: 6, ridge: true, step: 0.002 })
  fillUnder(ctx, far, horizon + 0.005, css([18, 30, 44]))
  const snowField = (seedOff: number, lit: RGB, ridge: Pt[]) => fieldSurface(Math.round(pw / 2), Math.round((pw / 2) * H * 0.5), H, (u, v, o) => {
    const d = v - yAt(ridge, Math.min(1.01, Math.max(-0.01, u)))
    const gully = fbm(noise, u * 45 + seedOff, v * 9, 4) * 0.5 + 0.5
    const rr = ridged(noise, u * 9 + seedOff, v * 5, 3)
    const m = smoothstep(0.52, 0.6, gully + 0.12 - d * 4) * smoothstep(0.25, 0.55, rr)
    o[0] = lit[0] / 255; o[1] = lit[1] / 255; o[2] = lit[2] / 255; o[3] = m * 0.6
  }, horizon - H * 0.45, horizon + H * 0.05)
  ctx.save()
  pathUnder(ctx, far, horizon + 0.005)
  ctx.clip()
  ctx.drawImage(snowField(5, mix([90, 120, 140], auroraTint, 0.35), far).canvas, 0, horizon - H * 0.45, 1, H * 0.5)
  const fg = ctx.createLinearGradient(0, horizon - 0.25, 0, horizon)
  fg.addColorStop(0, css([20, 40, 50], 0))
  fg.addColorStop(1, css([30, 60, 70], 0.55))
  ctx.fillStyle = fg
  ctx.fillRect(0, horizon - 0.25, 1, 0.26)
  ctx.restore()
  const near = ridgeLine(noise, { base: horizon + 0.004, amp: rng.range(0.05, 0.12), freq: rng.range(2.5, 4), off: rng.range(40, 70), oct: 6, ridge: true, step: 0.002, tilt: rng.range(-0.1, 0.1) })
  fillUnder(ctx, near, horizon + 0.01, css([8, 13, 20]))
  ctx.save()
  pathUnder(ctx, near, horizon + 0.01)
  ctx.clip()
  ctx.globalAlpha = 0.5
  ctx.drawImage(snowField(55, [70, 94, 106], near).canvas, 0, horizon - H * 0.45, 1, H * 0.5)
  ctx.restore()

  // ---- lake mirror or snowy foreground
  let shore: Pt[]
  if (lake) {
    const yp = Math.round(horizon * pw)
    const hp = Math.round(H * pw) - yp
    const tmp = createSurface(pw, hp)
    tmp.ctx.translate(0, hp)
    tmp.ctx.scale(1, -1)
    tmp.ctx.drawImage(ctx.canvas, 0, Math.max(0, yp - hp), pw, Math.min(hp, yp), 0, Math.max(0, hp - yp), pw, Math.min(hp, yp))
    const b = blurSurface(tmp, pw * 0.003)
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalAlpha = 0.85
    ctx.drawImage(b.canvas, 0, yp)
    ctx.restore()
    ctx.fillStyle = css([2, 6, 12], 0.3)
    ctx.fillRect(0, horizon, 1, H - horizon)
    // ripples
    for (let i = 0; i < 120; i++) {
      const y = horizon + Math.pow(rng.float(), 1.4) * (H - horizon)
      ctx.fillStyle = css([0, 0, 0], rng.range(0.1, 0.3))
      ctx.fillRect(rng.range(-0.2, 1), y, rng.range(0.1, 0.5), s.px * rng.range(1, 2.5))
    }
    shore = ridgeLine(noise, { base: H - rng.range(0.04, 0.12), amp: 0.05, freq: 2, off: 80, oct: 4, tilt: rng.range(-0.2, 0.2) })
  } else {
    shore = ridgeLine(noise, { base: horizon + (H - horizon) * 0.45, amp: 0.08, freq: 1.5, off: 90, oct: 4, tilt: rng.range(-0.15, 0.15) })
    const sg = ctx.createLinearGradient(0, horizon, 0, H)
    sg.addColorStop(0, css([40, 64, 72]))
    sg.addColorStop(1, css([16, 26, 34]))
    fillUnder(ctx, ridgeLine(noise, { base: horizon + 0.012, amp: 0.01, freq: 3, off: 77 }), H + 0.01, sg)
  }
  fillUnder(ctx, shore, H + 0.01, css(lake ? [6, 10, 14] : [22, 36, 44]))
  // pines along the shore, larger near the edges
  const pc = css([4, 7, 10])
  const nP = rng.int(10, 26)
  for (let i = 0; i < nP; i++) {
    const x = rng.chance(0.7) ? (rng.chance(0.5) ? rng.range(-0.02, 0.3) : rng.range(0.7, 1.02)) : rng.float()
    const y = yAt(shore, Math.min(1.01, Math.max(-0.01, x))) + 0.01
    const edge = Math.abs(x - 0.5) * 2
    pine(ctx, rng, x, y, rng.range(0.06, 0.12) + edge * rng.range(0.05, 0.2), pc)
  }
}

export const aurora: FilmImpl = {
  meta: {
    id: 'aurora',
    name: 'Северное сияние',
    short: 'AURORA 1600',
    description: 'Ленты света над горами и звёздами',
    swatch: ['#0b1a2a', '#3dffa0', '#b04cff'],
  },
  paper: [236, 233, 226],
  devTone: [200, 216, 214],
  devMono: 0.6,
  draw,
  grade: (env) =>
    baseGrade({
      contrast: 0.22,
      lift: [0.02, 0.03, 0.05],
      gain: [0.98 + env.warmth * 0.02, 1, 1.02],
      gamma: [1.05, 1, 0.98],
      sat: 1.12,
      shadowTint: [-0.01, 0.01, 0.03],
      grain: 0.08,
      grainChroma: 0.45,
      grainClump: 0.25,
      vignette: 0.42,
    }),
  bloom: () => [
    { radius: 0.004, strength: 0.6, tint: [255, 255, 255] },
    { radius: 0.05, strength: 0.7, tint: [220, 255, 240] },
  ],
}
