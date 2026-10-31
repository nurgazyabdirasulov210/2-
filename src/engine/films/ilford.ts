// Ильфорд HP5 — black & white, dramatic skies, horizons and architecture, heavy grain.
import { blurSurface, createSurface, fieldSurface } from '../canvas'
import { cloudiness } from '../env'
import { fbm } from '../noise'
import { baseGrade, type FilmImpl, type Scene } from '../types'
import { clamp, css, smoothstep, type RGB } from '../util'
import { fillUnder, glowDot, ridgeLine, stars, yAt } from './common'

const gray = (v: number, a = 1) => css([v * 255, v * 255, v * 255], a)

function sky(s: Scene, horizon: number, sunX: number, sunY: number, cover: number): void {
  const { ctx, noise, H, env, rng, pw } = s
  const night = env.night
  const topV = night ? 0.05 : rng.range(0.16, 0.34)
  const horV = night ? 0.3 : rng.range(0.72, 0.86)
  const ox = rng.range(0, 50)
  const stretch = rng.range(1.7, 2.6)
  const th = 0.56 - cover * 0.28
  const sx = rng.range(1.2, 1.8)
  const f = fieldSurface(Math.round(pw / 3), Math.round((pw / 3) * (horizon / 1)), H, (u, v, o) => {
    // perspective: clouds flatten and shrink towards the horizon
    const pv = 1 / (0.25 + (horizon - v) / horizon)
    const x = u * sx + ox
    const y = v * stretch * pv * 0.6
    const shape = (dx: number, dy: number) => {
      const base = fbm(noise, x + dx, y + dy, 3, 2, 0.5) * 0.5 + 0.5
      const det = fbm(noise, (x + dx) * 4.3 + 11, (y + dy) * 4.3, 4, 2.1, 0.55)
      return base + det * 0.13
    }
    const d = shape(0, 0)
    const dx = sunX - u
    const dy = sunY - v
    const dl = Math.sqrt(dx * dx + dy * dy) + 1e-6
    const d2 = shape((dx / dl) * 0.04, (dy / dl) * 0.04 - 0.03)
    const persp = smoothstep(horizon, horizon * 0.25, v)
    const dens = smoothstep(th, th + 0.1, d)
    const core = smoothstep(th + 0.05, th + 0.3, d)
    const lit = clamp(0.55 + (d - d2) * 10 - core * 0.35)
    const sunGlow = Math.exp(-(dx * dx + dy * dy) * 9)
    const bg = topV + (horV - topV) * Math.pow(v / horizon, 1.4) + sunGlow * (night ? 0.35 : 0.5)
    const edge = (1 - smoothstep(0.0, 0.6, dens)) * sunGlow * 0.7
    const cloudV = night ? 0.1 + lit * 0.3 + sunGlow * 0.4 : 0.22 + lit * 0.72 + edge
    const vv = bg + (cloudV - bg) * dens * (0.95 - (1 - persp) * 0.3)
    o[0] = o[1] = o[2] = clamp(vv)
  }, 0, horizon + 0.004)
  ctx.drawImage(f.canvas, 0, 0, 1, horizon + 0.004)
  if (night) {
    stars(ctx, s.glow, rng.fork('stars'), 0, horizon * 0.8, 180, s.px)
  }
  // sun / moon disc and crepuscular rays
  const vis = 1 - cover * 0.6
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  glowDot(ctx, sunX, sunY, 0.4, [255, 255, 255], 0.35 * vis)
  ctx.fillStyle = gray(1, 0.9 * vis)
  ctx.beginPath()
  ctx.arc(sunX, sunY, night ? 0.02 : 0.026, 0, Math.PI * 2)
  ctx.fill()
  glowDot(s.glow, sunX, sunY, 0.08, [255, 255, 255], 0.9 * vis)
  if (!night && rng.chance(0.75)) {
    const n = rng.int(7, 14)
    for (let i = 0; i < n; i++) {
      const a = Math.PI / 2 + rng.range(-0.9, 0.9)
      const sp = rng.range(0.015, 0.05)
      const len = H * 1.2
      const g = ctx.createLinearGradient(sunX, sunY, sunX + Math.cos(a) * len, sunY + Math.sin(a) * len)
      g.addColorStop(0, gray(1, 0.18 * vis))
      g.addColorStop(1, gray(1, 0))
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(sunX, sunY)
      ctx.lineTo(sunX + Math.cos(a - sp) * len, sunY + Math.sin(a - sp) * len)
      ctx.lineTo(sunX + Math.cos(a + sp) * len, sunY + Math.sin(a + sp) * len)
      ctx.fill()
    }
  }
  ctx.restore()
}

/** Mirror the area above `y` into the area below, darkened (water). */
function reflect(s: Scene, y: number, dark: number, blurPx: number): void {
  const { ctx, pw, H } = s
  const c = ctx.canvas
  const yp = Math.round(y * pw)
  const hp = Math.min(yp, Math.round(H * pw) - yp)
  if (hp <= 0) return
  const tmp = createSurface(pw, hp)
  tmp.ctx.translate(0, hp)
  tmp.ctx.scale(1, -1)
  tmp.ctx.drawImage(c, 0, yp - hp, pw, hp, 0, 0, pw, hp)
  const b = blurPx > 0.5 ? blurSurface(tmp, blurPx) : tmp
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.drawImage(b.canvas, 0, yp, pw, hp)
  ctx.restore()
  ctx.fillStyle = gray(0, dark)
  ctx.fillRect(0, y, 1, H - y)
}

function sea(s: Scene): void {
  const { ctx, rng, H, env, px } = s
  const horizon = H * rng.range(0.52, 0.62)
  const sunX = rng.range(0.25, 0.75)
  const sunY = horizon * rng.range(0.35, 0.7)
  const cover = cloudiness(env, rng.range(0.35, 0.8))
  sky(s, horizon, sunX, sunY, cover)
  // long exposure water: smooth mirror of the sky, misty
  reflect(s, horizon, 0.18, 0.03 * s.pw)
  const wg = ctx.createLinearGradient(0, horizon, 0, H)
  wg.addColorStop(0, gray(0.85, 0.35))
  wg.addColorStop(1, gray(0.1, 0.55))
  ctx.fillStyle = wg
  ctx.fillRect(0, horizon, 1, H - horizon)
  // glint path
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  for (let i = 0; i < 260; i++) {
    const y = horizon + Math.pow(rng.float(), 1.6) * (H - horizon)
    const spread = 0.02 + (y - horizon) * 0.35
    const x = sunX + rng.gauss() * spread * 0.5
    const a = (0.12 + rng.float() * 0.25) * (1 - cover * 0.6) * (1 - (y - horizon) / (H - horizon) * 0.6)
    ctx.fillStyle = gray(1, a)
    ctx.fillRect(x - spread * 0.2, y, spread * rng.range(0.1, 0.5), px * rng.range(1, 2.5))
  }
  ctx.restore()
  // distant headland
  if (rng.chance(0.7)) {
    const left = rng.chance(0.5)
    const pts = ridgeLine(s.noise, { base: horizon + 0.002, amp: 0.035, freq: 3, off: 40, oct: 4 })
    const cut = rng.range(0.25, 0.45)
    const land = pts.map(([x, y]) => [x, (left ? x < cut : x > 1 - cut) ? y - (left ? cut - x : x - 1 + cut) * 0.25 : horizon + 0.002] as [number, number])
    fillUnder(ctx, land, horizon + 0.004, gray(0.32))
    if (rng.chance(0.6)) {
      const lx = left ? cut * 0.55 : 1 - cut * 0.55
      const ly = yAt(land, lx)
      ctx.fillStyle = gray(0.85)
      ctx.fillRect(lx - 0.004, ly - 0.045, 0.008, 0.045)
      ctx.fillStyle = gray(0.2)
      ctx.fillRect(lx - 0.005, ly - 0.05, 0.01, 0.007)
      ctx.fillRect(lx - 0.004, ly - 0.025, 0.008, 0.006)
    }
  }
  // groyne: posts marching out to sea
  const vx = rng.range(0.3, 0.7)
  const lat = rng.range(-1.6, 1.6)
  const camH = 1.2
  const f = 0.55
  for (let z = 30; z >= 1.2; z -= rng.range(0.35, 0.7) * Math.max(0.6, z * 0.08)) {
    const x = vx + (lat * f) / z
    const yb = horizon + ((camH + rng.range(-0.05, 0.05)) * f) / z
    const hgt = (rng.range(0.5, 1.4) * f) / z
    const wd = (0.16 * f) / z
    const g = ctx.createLinearGradient(x, yb - hgt, x, yb)
    g.addColorStop(0, gray(0.14))
    g.addColorStop(1, gray(0.05))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.roundRect(x - wd / 2, yb - hgt, wd, hgt, wd * 0.3)
    ctx.fill()
    const rg = ctx.createLinearGradient(0, yb, 0, yb + hgt * 0.9)
    rg.addColorStop(0, gray(0.1, 0.55))
    rg.addColorStop(1, gray(0.1, 0))
    ctx.fillStyle = rg
    ctx.fillRect(x - wd / 2, yb, wd, hgt * 0.9)
  }
  // dark rocks in the foreground
  if (rng.chance(0.6)) {
    const pts = ridgeLine(s.noise, { base: H + 0.02, amp: 0.16, freq: 4, off: 90, oct: 5, ridge: true })
    const side = rng.chance(0.5)
    const rock = pts.map(([x, y]) => [x, y + (side ? x : 1 - x) * 0.32] as [number, number])
    fillUnder(ctx, rock, H + 0.02, gray(0.06))
  }
}

function city(s: Scene): void {
  const { ctx, rng, H, env, noise } = s
  const horizon = H * rng.range(0.6, 0.7)
  const sunX = rng.range(0.2, 0.8)
  const sunY = horizon * rng.range(0.45, 0.8)
  const cover = cloudiness(env, rng.range(0.3, 0.75))
  sky(s, horizon, sunX, sunY, cover)
  const layers = [
    { v: 0.6, hMin: 0.03, hMax: 0.09, wMin: 0.02, wMax: 0.06 },
    { v: 0.38, hMin: 0.05, hMax: 0.16, wMin: 0.03, wMax: 0.09 },
    { v: 0.12, hMin: 0.06, hMax: 0.24, wMin: 0.05, wMax: 0.14 },
  ]
  const landmarkLayer = rng.int(0, 1)
  layers.forEach((L, li) => {
    const base = horizon + li * 0.012
    let x = -0.02
    const landmarkX = rng.range(0.15, 0.85)
    let placed = false
    while (x < 1.02) {
      const w = rng.range(L.wMin, L.wMax)
      let h = rng.range(L.hMin, L.hMax) * (0.6 + 0.6 * (fbm(noise, x * 3 + li * 10, 0.5, 2) * 0.5 + 0.5))
      const v = L.v + rng.range(-0.04, 0.04)
      ctx.fillStyle = gray(v)
      ctx.fillRect(x, base - h, w + 0.001, h + 0.05)
      // roof details
      const r = rng.float()
      if (r < 0.2) ctx.fillRect(x + w * 0.4, base - h - 0.02, 0.0015, 0.02)
      else if (r < 0.35) { ctx.fillRect(x + w * 0.15, base - h - 0.012, w * 0.7, 0.012); h += 0.012 }
      else if (r < 0.45) { ctx.fillRect(x + w * 0.3, base - h - 0.008, w * 0.15, 0.008) }
      // facade lit by the sun from one side
      ctx.fillStyle = gray(Math.min(1, v + 0.12), 0.5)
      if (sunX > x + w) ctx.fillRect(x + w * 0.82, base - h, w * 0.18, h)
      else ctx.fillRect(x, base - h, w * 0.18, h)
      if (li > 0) {
        const rows = Math.floor(h / 0.012)
        const cols = Math.max(2, Math.floor(w / 0.009))
        for (let i = 1; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            if (!rng.chance(0.55)) continue
            const wx = x + (j + 0.3) * (w / cols)
            const wy = base - h + i * 0.012
            ctx.fillStyle = gray(rng.chance(0.15) ? 0.85 : v + rng.range(-0.06, 0.12), 0.8)
            ctx.fillRect(wx, wy, (w / cols) * 0.45, 0.005)
          }
        }
      }
      if (!placed && li === landmarkLayer && x > landmarkX) {
        placed = true
        const lw = 0.08
        const lh = 0.26 + rng.float() * 0.1
        ctx.fillStyle = gray(v - 0.04)
        // stepped tower with spire
        ctx.fillRect(x - lw / 2, base - lh * 0.55, lw, lh * 0.55)
        ctx.fillRect(x - lw * 0.32, base - lh * 0.75, lw * 0.64, lh * 0.22)
        ctx.fillRect(x - lw * 0.18, base - lh * 0.9, lw * 0.36, lh * 0.16)
        ctx.beginPath()
        ctx.moveTo(x - lw * 0.06, base - lh * 0.9)
        ctx.lineTo(x, base - lh * 1.15)
        ctx.lineTo(x + lw * 0.06, base - lh * 0.9)
        ctx.fill()
      }
      x += w
    }
    // haze between layers
    const hg = ctx.createLinearGradient(0, horizon - 0.12, 0, base + 0.01)
    hg.addColorStop(0, gray(0.85, 0))
    hg.addColorStop(1, gray(0.85, li < 2 ? 0.45 : 0.15))
    ctx.fillStyle = hg
    ctx.fillRect(0, horizon - 0.12, 1, base + 0.01 - horizon + 0.12)
  })
  // river with reflection
  const wy = horizon + 0.035
  ctx.fillStyle = gray(0.07)
  ctx.fillRect(0, horizon + 0.024, 1, 0.012)
  reflect(s, wy, 0.35, 0.012 * s.pw)
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  for (let i = 0; i < 160; i++) {
    const y = wy + Math.pow(rng.float(), 1.3) * (H - wy)
    ctx.fillStyle = gray(1, rng.range(0.03, 0.12))
    ctx.fillRect(rng.range(-0.1, 1), y, rng.range(0.05, 0.3), s.px * rng.range(1, 3))
  }
  ctx.restore()
  // embankment railing in the foreground
  if (rng.chance(0.6)) {
    const ry = H - rng.range(0.08, 0.16)
    ctx.fillStyle = gray(0.05)
    ctx.fillRect(0, ry, 1, H - ry)
    ctx.fillRect(0, ry - 0.06, 1, 0.006)
    for (let x = 0.01; x < 1; x += 0.035) ctx.fillRect(x, ry - 0.06, 0.004, 0.06)
    for (let x = 0.03; x < 1; x += 0.035) {
      ctx.beginPath()
      ctx.arc(x, ry - 0.03, 0.012, 0, Math.PI * 2)
      ctx.lineWidth = 0.0025
      ctx.strokeStyle = gray(0.05)
      ctx.stroke()
    }
  }
}

function branch(s: Scene, x: number, y: number, ang: number, len: number, wd: number, depth: number, lean: number): void {
  const { ctx, rng } = s
  const ex = x + Math.cos(ang) * len
  const ey = y + Math.sin(ang) * len
  ctx.lineWidth = wd
  ctx.beginPath()
  ctx.moveTo(x, y)
  const mx = (x + ex) / 2 + rng.range(-0.12, 0.12) * len
  const my = (y + ey) / 2 + rng.range(-0.12, 0.12) * len
  ctx.quadraticCurveTo(mx, my, ex, ey)
  ctx.stroke()
  if (depth <= 0 || len < 0.0025) return
  // leader continues, side branches fork off
  const up = -Math.PI / 2
  const leaderA = ang + rng.range(-0.25, 0.25) + (up - ang) * 0.08 + lean * 0.05
  branch(s, ex, ey, leaderA, len * rng.range(0.72, 0.86), wd * 0.72, depth - 1, lean)
  const sides = rng.chance(0.4) ? 2 : 1
  for (let i = 0; i < sides; i++) {
    const dir = i === 0 ? rng.sign() : -1
    const a = ang + dir * rng.range(0.55, 1.1) + lean * 0.05
    branch(s, ex, ey, a, len * rng.range(0.55, 0.75), wd * 0.6, depth - 1 - (rng.chance(0.3) ? 1 : 0), lean)
  }
}

function loneTree(s: Scene): void {
  const { ctx, rng, H, env, noise, px } = s
  const horizon = H * rng.range(0.66, 0.76)
  const sunX = rng.range(0.2, 0.8)
  const sunY = horizon * rng.range(0.4, 0.8)
  const cover = cloudiness(env, rng.range(0.4, 0.85))
  sky(s, horizon, sunX, sunY, cover)
  // far treeline + field
  const tl = ridgeLine(noise, { base: horizon + 0.004, amp: 0.012, freq: 14, off: 7, oct: 3 })
  fillUnder(ctx, tl, H + 0.01, gray(0.36))
  const fg = ctx.createLinearGradient(0, horizon, 0, H)
  fg.addColorStop(0, gray(0.42))
  fg.addColorStop(1, gray(0.1))
  fillUnder(ctx, ridgeLine(noise, { base: horizon + 0.012, amp: 0.006, freq: 2, off: 3 }), H + 0.01, fg)
  // furrows converging to a vanishing point
  const vx = rng.range(0.2, 0.8)
  ctx.strokeStyle = gray(0.05, 0.25)
  for (let i = -30; i <= 30; i++) {
    ctx.lineWidth = 0.0015
    ctx.beginPath()
    ctx.moveTo(vx + i * 0.004, horizon + 0.014)
    ctx.lineTo(vx + i * 0.09, H)
    ctx.stroke()
  }
  // grass
  ctx.lineCap = 'round'
  for (let i = 0; i < 900; i++) {
    const y0 = horizon + 0.02 + Math.pow(rng.float(), 0.6) * (H - horizon)
    const x = rng.float()
    const len = 0.004 + (y0 - horizon) * 0.12 * rng.range(0.4, 1)
    ctx.strokeStyle = gray(rng.chance(0.3) ? 0.6 : 0.08, 0.6)
    ctx.lineWidth = Math.max(px, 0.0012)
    ctx.beginPath()
    ctx.moveTo(x, y0)
    ctx.lineTo(x + rng.range(-0.3, 0.3) * len + env.wind * len * 0.4, y0 - len)
    ctx.stroke()
  }
  // the tree
  const tx = rng.chance(0.5) ? rng.range(0.22, 0.4) : rng.range(0.6, 0.78)
  const ty = horizon + 0.03
  const size = rng.range(0.1, 0.14)
  ctx.strokeStyle = gray(0.05)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  branch(s, tx, ty, -Math.PI / 2 + rng.range(-0.08, 0.08), size, size * 0.2, 9, env.wind)
  // fence posts
  if (rng.chance(0.5)) {
    for (let i = 0; i < 12; i++) {
      const t = i / 11
      const x = 1 - t * 0.9
      const y = H - 0.05 - t * (H - horizon - 0.07)
      const hh = 0.08 * (1 - t * 0.85)
      ctx.fillStyle = gray(0.06)
      ctx.fillRect(x, y - hh, 0.008 * (1 - t * 0.8), hh)
    }
  }
}

function draw(s: Scene): void {
  const v = s.rng.int(0, 2)
  if (v === 0) sea(s)
  else if (v === 1) city(s)
  else loneTree(s)
}

export const ilford: FilmImpl = {
  meta: {
    id: 'ilford',
    name: 'Ильфорд HP5',
    short: 'ILFORD HP5+',
    description: 'Ч/б, драматичное небо, горизонт и крупное зерно',
    swatch: ['#1c1c1c', '#8a8a87', '#e8e6e1'],
  },
  paper: [238, 235, 229],
  devTone: [222, 218, 212],
  devMono: 1,
  draw,
  grade: (env) =>
    baseGrade({
      mono: true,
      contrast: 0.5 - env.fog * 0.2,
      lift: [0.025, 0.022, 0.02],
      gain: [0.96, 0.95, 0.93],
      gamma: [1.08, 1.08, 1.1],
      sat: 0,
      grain: 0.12,
      grainChroma: 0,
      grainClump: 0.45,
      vignette: 0.5,
    }),
  bloom: () => [{ radius: 0.03, strength: 0.5, tint: [255, 255, 255] as RGB }],
  precipTone: [240, 240, 240],
}
