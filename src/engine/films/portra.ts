// Портра 400 — warm rolling hills, sun, haze. Seeded composition & palette.
import { fieldSurface } from '../canvas'
import { cloudiness } from '../env'
import { fbm } from '../noise'
import { baseGrade, type FilmImpl, type Scene } from '../types'
import { clamp, css, mix, scale, smoothstep, type RGB } from '../util'
import { fillUnder, glowDot, pathUnder, ridgeLine, stars, yAt, type Pt } from './common'

// far -> near; alternating wheat / meadow / olive bands
const FIELD_SETS: RGB[][] = [
  [[120, 128, 84], [214, 168, 86], [108, 132, 66], [226, 178, 92], [150, 120, 52], [150, 124, 58]],
  [[132, 130, 96], [196, 150, 82], [222, 186, 110], [104, 126, 62], [200, 150, 70], [156, 126, 62]],
  [[110, 124, 90], [140, 150, 80], [230, 190, 120], [176, 140, 70], [90, 116, 58], [164, 132, 64]],
  [[150, 130, 100], [228, 172, 104], [126, 138, 74], [214, 154, 84], [168, 128, 60], [148, 118, 60]],
]

function draw(s: Scene): void {
  const { ctx, glow, rng, noise, env, H, px } = s
  const night = env.night
  const cloud = cloudiness(env, rng.range(0.05, 0.45))
  const gold = night ? 0 : clamp((0.18 + env.golden * 0.85 + rng.range(0, 0.15)) * (1 - cloud * 0.35))
  const rose = rng.float()
  const horizon = H * rng.range(0.4, 0.5)
  const sunX = rng.range(0.2, 0.8)
  const elev = night ? 0.35 : clamp(env.sunElev, 0.05, 1) * (1 - gold * 0.75)
  const sunY = Math.max(0.12, horizon - 0.03 - elev * (horizon - 0.12))
  const warm = env.warmth * 0.5

  // ---- sky
  let top: RGB, mid: RGB, hor: RGB, sunC: RGB
  if (night) {
    top = [10, 18, 38]; mid = [26, 40, 70]; hor = [62, 76, 104]; sunC = [220, 228, 240]
  } else {
    top = mix([96, 140, 196], [104, 136, 186], gold)
    mid = mix([170, 198, 224], mix([236, 196, 166], [232, 178, 176], rose), gold)
    hor = mix([232, 230, 218], mix([255, 214, 160], [252, 196, 170], rose), gold)
    sunC = mix([255, 250, 236], [255, 226, 170], gold)
    const grey: RGB = [196, 196, 194]
    top = mix(top, grey, cloud * 0.55)
    mid = mix(mid, grey, cloud * 0.45)
    hor = mix(hor, [222, 214, 204], cloud * 0.4)
    top = mix(top, [255, 200, 140], warm * 0.12)
  }
  const sky = ctx.createLinearGradient(0, 0, 0, horizon + 0.1)
  sky.addColorStop(0, css(top))
  sky.addColorStop(0.55, css(mid))
  sky.addColorStop(1, css(hor))
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, 1, H)

  if (night) stars(ctx, glow, rng.fork('stars'), 0, horizon, 260, px, [[255, 255, 255], [255, 236, 210], [210, 225, 255]])

  // ---- sun / moon glow
  const sunVis = night ? 0.9 : 1 - cloud * 0.75
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  glowDot(ctx, sunX, sunY, 0.95, mix(sunC, [255, 170, 110], gold * 0.6), (night ? 0.25 : 0.6) * sunVis, 0.08)
  glowDot(ctx, sunX, sunY, 0.18, sunC, 0.75 * sunVis, 0.2)
  ctx.restore()
  ctx.fillStyle = css(night ? [236, 238, 244] : [255, 252, 240], sunVis)
  ctx.beginPath()
  ctx.arc(sunX, sunY, night ? 0.022 : 0.034, 0, Math.PI * 2)
  ctx.fill()
  glowDot(glow, sunX, sunY, 0.12, sunC, 0.9 * sunVis, 0.25)

  // ---- clouds (stratus streaks, low-res field)
  const cAmt = 0.3 + cloud * 0.7
  const ox = rng.range(0, 100)
  const lit: RGB = night ? [120, 130, 160] : mix([250, 248, 244], [255, 196, 160], gold)
  const shade: RGB = night ? [40, 50, 74] : mix([170, 176, 190], [170, 128, 140], gold)
  const cl = fieldSurface(Math.round(s.pw / 4), Math.round((s.pw / 4) * (horizon + 0.05) / 1), H, (u, v, o) => {
    const wx = fbm(noise, u * 2 + ox, v * 3, 3) * 0.4
    const n = fbm(noise, u * 2.2 + wx + ox, v * 9 + wx * 2, 5) * 0.5 + 0.5
    const fade = smoothstep(horizon + 0.02, horizon * 0.55, v)
    const c = smoothstep(0.62 - cAmt * 0.32, 0.95 - cAmt * 0.2, n) * fade
    const dx = u - sunX
    const dy = v - sunY
    const near = Math.exp(-(dx * dx + dy * dy) * 12)
    const col = mix(lit, shade, smoothstep(0.35, 1, c) * 0.7)
    const b = mix(col, [255, 240, 210], near * (night ? 0.2 : 0.6))
    o[0] = b[0] / 255; o[1] = b[1] / 255; o[2] = b[2] / 255
    o[3] = c * 0.9
  }, 0, horizon + 0.05)
  ctx.drawImage(cl.canvas, 0, 0, 1, horizon + 0.05)

  // ---- hills with atmospheric perspective
  const fields = FIELD_SETS[rng.int(0, FIELD_SETS.length - 1)].map((c) => mix(c, [255, 190, 120], warm * 0.15)) as RGB[]
  const haze: RGB = night ? [58, 70, 98] : mix(hor, [224, 200, 190], 0.25)
  const L = rng.int(5, 7)
  const layers: { pts: Pt[]; col: RGB; t: number }[] = []
  for (let i = 0; i < L; i++) {
    const t = i / (L - 1)
    const base = horizon + (H - horizon) * (0.04 + 0.62 * Math.pow(t, 1.35))
    const amp = (0.04 + 0.2 * t) * rng.range(0.75, 1.3)
    const pts = ridgeLine(noise, { base, amp, freq: 1.7 - 1.0 * t + rng.range(-0.25, 0.25), off: i * 13.7 + ox, oct: 2, tilt: rng.range(-0.12, 0.12) * t })
    const ci = Math.min(fields.length - 1, Math.round(t * (fields.length - 1)))
    let col = fields[ci]
    if (night) col = mix(scale(col, 0.25), [30, 40, 66], 0.6)
    const hz = Math.pow(1 - t, 1.6) * (0.85 + env.fog * 0.15)
    const c = mix(col, haze, hz)
    // valley mist rising under this ridge
    if (i > 0) {
      const mtop = Math.min(...pts.map((p) => p[1])) - 0.04
      const mg = ctx.createLinearGradient(0, mtop, 0, base + 0.02)
      mg.addColorStop(0, css(haze, 0))
      mg.addColorStop(1, css(mix(haze, [255, 240, 225], night ? 0 : 0.3), 0.55 + env.fog * 0.3))
      ctx.fillStyle = mg
      ctx.fillRect(0, mtop, 1, base + 0.02 - mtop)
    }
    const minY = Math.min(...pts.map((p) => p[1]))
    const g = ctx.createLinearGradient(0, minY, 0, minY + 0.18 + t * 0.2)
    g.addColorStop(0, css(mix(c, [255, 232, 180], night ? 0.05 : gold * 0.3 * (1 - t * 0.3))))
    g.addColorStop(0.35, css(c))
    g.addColorStop(1, css(scale(c, 0.78 - 0.12 * t)))
    fillUnder(ctx, pts, H + 0.01, g)
    // side light from the sun / crop rows
    ctx.save()
    pathUnder(ctx, pts, H + 0.01)
    ctx.clip()
    ctx.globalCompositeOperation = 'screen'
    glowDot(ctx, sunX, minY - 0.05, 0.7, night ? [80, 90, 120] : [255, 190, 120], (night ? 0.08 : 0.28 * gold) * (1 - hz * 0.5), 0.1)
    ctx.globalCompositeOperation = 'source-over'
    if (t > 0.3 && t < 0.95 && rng.chance(0.55)) {
      // furrows following the contour
      const rows = rng.int(10, 22)
      ctx.lineWidth = 0.0012 + t * 0.0018
      for (let k = 0; k < rows; k++) {
        const dy = (k / rows) * (0.08 + t * 0.2)
        ctx.strokeStyle = css(k % 2 ? scale(c, 0.85) : mix(c, [255, 230, 180], 0.12), 0.35)
        ctx.beginPath()
        for (let j = 0; j < pts.length; j += 3) {
          const [x, y] = pts[j]
          const yy = y + dy * (1 + 0.4 * Math.sin(x * 3 + k))
          if (j === 0) ctx.moveTo(x, yy)
          else ctx.lineTo(x, yy)
        }
        ctx.stroke()
      }
    }
    ctx.restore()
    layers.push({ pts, col: c, t })
  }

  // ---- trees on mid layers
  const shadowDir = night ? 0 : Math.sign(0.5 - sunX) || 1
  for (const { pts, col, t } of layers) {
    if (t < 0.15 || t > 0.9) continue
    const clusters = rng.int(1, 4)
    for (let c = 0; c < clusters; c++) {
      const cx = rng.range(0.02, 0.98)
      const cypress = rng.chance(0.45)
      const n = rng.int(1, cypress ? 7 : 6)
      const size = (0.005 + 0.024 * t) * rng.range(0.7, 1.3)
      const hz = Math.pow(1 - t, 1.6) * 0.85
      const leaf: RGB = night ? [24, 30, 44] : mix(mix([52, 66, 34], [70, 64, 30], rng.float()), haze, hz)
      for (let k = 0; k < n; k++) {
        const x = cx + (k - n / 2) * size * (cypress ? 0.9 : 1.5) + rng.range(-0.4, 0.4) * size
        const y = yAt(pts, x) + size * 0.5
        const sz = size * rng.range(0.75, 1.25)
        // long evening shadow
        if (!night && gold > 0.3) {
          ctx.fillStyle = css(scale(col, 0.6), 0.45 * gold * (1 - hz))
          ctx.beginPath()
          ctx.ellipse(x + shadowDir * sz * 2.4, y + sz * 0.12, sz * 2.6, sz * 0.22, 0, 0, Math.PI * 2)
          ctx.fill()
        }
        if (cypress) {
          const hgt = sz * rng.range(3, 4.4)
          const wd = sz * 0.5
          ctx.fillStyle = css(leaf)
          ctx.beginPath()
          ctx.moveTo(x, y - hgt)
          ctx.bezierCurveTo(x + wd * 0.9, y - hgt * 0.65, x + wd * 1.1, y - hgt * 0.2, x + wd * 0.3, y)
          ctx.lineTo(x - wd * 0.3, y)
          ctx.bezierCurveTo(x - wd * 1.1, y - hgt * 0.2, x - wd * 0.9, y - hgt * 0.65, x, y - hgt)
          ctx.fill()
          if (!night) {
            const side = Math.sign(sunX - x) || 1
            ctx.fillStyle = css([255, 210, 140], 0.3 * gold * (1 - hz))
            ctx.beginPath()
            ctx.moveTo(x, y - hgt)
            ctx.bezierCurveTo(x + side * wd * 0.9, y - hgt * 0.65, x + side * wd * 1.1, y - hgt * 0.2, x + side * wd * 0.3, y)
            ctx.lineTo(x + side * wd * 0.35, y - hgt * 0.4)
            ctx.closePath()
            ctx.fill()
          }
        } else {
          ctx.fillStyle = css([60, 48, 36], 0.9)
          ctx.fillRect(x - sz * 0.06, y - sz * 0.9, sz * 0.12, sz * 0.9)
          const blobs = rng.int(5, 9)
          for (let b = 0; b < blobs; b++) {
            const a = (b / blobs) * Math.PI * 2
            const bx = x + Math.cos(a) * sz * 0.55
            const by = y - sz * 1.25 + Math.sin(a) * sz * 0.4
            const br = sz * rng.range(0.4, 0.62)
            ctx.fillStyle = css(scale(leaf, rng.range(0.85, 1.1)))
            ctx.beginPath()
            ctx.arc(bx, by, br, 0, Math.PI * 2)
            ctx.fill()
            if (!night && Math.cos(a) * (sunX - x) > 0 && Math.sin(a) < 0.3) {
              ctx.fillStyle = css([255, 214, 150], 0.25 * gold * (1 - hz))
              ctx.beginPath()
              ctx.arc(bx + Math.sign(sunX - x) * br * 0.25, by - br * 0.2, br * 0.6, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }
      }
      // farmhouse lights at night
      if (night && rng.chance(0.6)) {
        const x = cx + size * 2.5
        const y = yAt(pts, x) - size * 0.3
        ctx.fillStyle = css([255, 200, 120], 0.95)
        ctx.fillRect(x, y, size * 0.3, size * 0.22)
        glowDot(glow, x, y, 0.02 + t * 0.02, [255, 170, 90], 0.9)
      }
    }
  }

  // ---- foreground grasses, backlit
  const fg = layers[layers.length - 1]
  const blades = Math.round(700 + rng.range(0, 500))
  const lean = (env.wind - 0.2) * 0.6 + rng.range(-0.15, 0.15)
  ctx.lineCap = 'round'
  for (let i = 0; i < blades; i++) {
    const x = rng.float() * 1.04 - 0.02
    const y0 = yAt(fg.pts, x) + Math.pow(rng.float(), 2) * 0.12
    const len = rng.range(0.012, 0.05) * (1 + (y0 - yAt(fg.pts, x)) * 4)
    const bend = lean * len + rng.range(-0.3, 0.3) * len
    const backlit = !night && Math.abs(x - sunX) < 0.35 && rng.chance(0.55)
    ctx.strokeStyle = backlit
      ? css(mix([255, 210, 140], [255, 236, 200], rng.float()), 0.35 + 0.4 * gold)
      : css(mix(scale(fg.col, rng.range(0.6, 1.15)), [230, 190, 110], rng.float() * 0.3), 0.9)
    ctx.lineWidth = rng.range(0.0008, 0.0022)
    ctx.beginPath()
    ctx.moveTo(x, y0)
    ctx.quadraticCurveTo(x + bend * 0.3, y0 - len * 0.6, x + bend, y0 - len)
    ctx.stroke()
    if (rng.chance(0.06)) {
      ctx.fillStyle = backlit ? css([255, 226, 170], 0.7) : css(scale(fg.col, 0.8))
      ctx.beginPath()
      ctx.ellipse(x + bend, y0 - len, 0.0016, 0.006, bend * 8, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // ---- birds
  if (!night && rng.chance(0.55)) {
    const n = rng.int(2, 7)
    const bx = rng.range(0.15, 0.85)
    const by = rng.range(0.12, horizon - 0.06)
    ctx.strokeStyle = css([60, 50, 50], 0.7)
    ctx.lineWidth = 0.0016
    for (let i = 0; i < n; i++) {
      const x = bx + rng.range(-0.12, 0.12)
      const y = by + rng.range(-0.05, 0.05)
      const sz = rng.range(0.005, 0.011)
      ctx.beginPath()
      ctx.moveTo(x - sz, y - sz * 0.3)
      ctx.quadraticCurveTo(x - sz * 0.4, y - sz * 0.6, x, y)
      ctx.quadraticCurveTo(x + sz * 0.4, y - sz * 0.6, x + sz, y - sz * 0.35)
      ctx.stroke()
    }
  }
}

export const portra: FilmImpl = {
  meta: {
    id: 'portra',
    name: 'Портра 400',
    short: 'PORTRA 400',
    description: 'Тёплые холмы, дымка и низкое солнце',
    swatch: ['#e9b37a', '#a7864f', '#6f8db0'],
  },
  paper: [239, 233, 223],
  devTone: [232, 214, 192],
  devMono: 0.85,
  draw,
  grade: (env) => {
    const w = env.warmth * 0.05 - env.rain * 0.04 - env.snow * 0.03
    return baseGrade({
      contrast: env.night ? 0.3 : 0.22,
      lift: [0.05, 0.045, 0.055],
      gain: [1.0 + w, 0.97, 0.9 - w],
      gamma: [0.96, 1, 1.04],
      sat: 1.02 - env.rain * 0.15,
      shadowTint: [-0.02, 0.01, 0.03],
      highlightTint: [0.03, 0.01, -0.03],
      grain: 0.07,
      grainChroma: 0.35,
      grainClump: 0.15,
      vignette: 0.32,
      vignetteTint: [0.02, -0.01, -0.03],
    })
  },
  bloom: (env) => [{ radius: 0.05, strength: env.night ? 0.5 : 0.6, tint: [255, 220, 170] }],
}
