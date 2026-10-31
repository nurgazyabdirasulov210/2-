// Полароид — pastel, soft, faded instant film: seaside, pool or dunes.
import { fieldSurface } from '../canvas'
import { cloudiness } from '../env'
import { fbm, ridged } from '../noise'
import { baseGrade, type FilmImpl, type Scene } from '../types'
import { css, mix, scale, smoothstep, type RGB } from '../util'
import { fillUnder, glowDot, ridgeLine, stars } from './common'

function pastelSky(s: Scene, horizon: number, sunX: number, sunY: number): { hor: RGB; top: RGB } {
  const { ctx, rng, env, H, noise, pw } = s
  const night = env.night
  const cloud = cloudiness(env, rng.range(0.1, 0.5))
  const pinkness = rng.float()
  const top: RGB = night ? [44, 52, 92] : mix(mix([150, 196, 222], [176, 200, 230], pinkness), [196, 200, 206], cloud * 0.5)
  const hor: RGB = night ? [196, 140, 170] : mix(mix([255, 214, 196], [250, 196, 206], pinkness), [232, 226, 220], cloud * 0.4)
  const g = ctx.createLinearGradient(0, 0, 0, horizon)
  g.addColorStop(0, css(top))
  g.addColorStop(0.6, css(mix(top, hor, 0.55)))
  g.addColorStop(1, css(hor))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 1, H)
  if (night) stars(ctx, s.glow, rng.fork('st'), 0, horizon * 0.7, 90, s.px)
  // puffy pastel clouds
  const ox = rng.range(0, 50)
  const amt = 0.25 + cloud * 0.6
  const cl = fieldSurface(Math.round(pw / 5), Math.round((pw / 5) * horizon), H, (u, v, o) => {
    const n = fbm(noise, u * 2.4 + ox, v * 4.2, 5) * 0.5 + 0.5
    const c = smoothstep(0.62 - amt * 0.2, 0.8 - amt * 0.15, n) * smoothstep(horizon, horizon * 0.6, v)
    const col = mix([255, 246, 240], [238, 200, 214], smoothstep(0.5, 1, v / horizon))
    o[0] = col[0] / 255; o[1] = col[1] / 255; o[2] = col[2] / 255; o[3] = c * 0.8
  }, 0, horizon)
  ctx.drawImage(cl.canvas, 0, 0, 1, horizon)
  // soft sun
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  glowDot(ctx, sunX, sunY, 0.5, [255, 236, 210], 0.55 * (1 - cloud * 0.5), 0.1)
  ctx.restore()
  ctx.fillStyle = css(night ? [250, 246, 236] : [255, 250, 236], 0.95)
  ctx.beginPath()
  ctx.arc(sunX, sunY, night ? 0.03 : 0.045, 0, Math.PI * 2)
  ctx.fill()
  glowDot(s.glow, sunX, sunY, 0.12, [255, 240, 220], 0.7)
  return { hor, top }
}

function seaside(s: Scene): void {
  const { ctx, rng, H, noise, env } = s
  const horizon = H * rng.range(0.42, 0.55)
  const sunX = rng.range(0.2, 0.8)
  const sunY = horizon * rng.range(0.45, 0.85)
  const { hor } = pastelSky(s, horizon, sunX, sunY)
  // sea
  const shore = horizon + (H - horizon) * rng.range(0.38, 0.55)
  const sea = ctx.createLinearGradient(0, horizon, 0, shore)
  const seaC: RGB = env.night ? [70, 90, 130] : rng.pick([[118, 178, 196], [130, 190, 190], [140, 170, 206]] as RGB[])
  sea.addColorStop(0, css(mix(seaC, hor, 0.35)))
  sea.addColorStop(1, css(mix(seaC, [190, 230, 226], 0.4)))
  ctx.fillStyle = sea
  ctx.fillRect(0, horizon, 1, shore - horizon + 0.02)
  // sun glitter
  for (let i = 0; i < 160; i++) {
    const y = horizon + Math.pow(rng.float(), 1.5) * (shore - horizon)
    const x = sunX + rng.gauss() * (0.02 + (y - horizon) * 0.4) * 0.6
    ctx.fillStyle = css([255, 248, 230], rng.range(0.2, 0.6))
    ctx.fillRect(x, y, rng.range(0.005, 0.03), s.px * 1.5)
  }
  // waves
  for (let i = 0; i < 18; i++) {
    const y = horizon + Math.pow((i + 1) / 19, 1.6) * (shore - horizon)
    ctx.strokeStyle = css([255, 255, 250], 0.25)
    ctx.lineWidth = 0.001 + (y - horizon) * 0.01
    ctx.beginPath()
    const x0 = rng.range(-0.2, 0.6)
    ctx.moveTo(x0, y)
    ctx.bezierCurveTo(x0 + 0.1, y - 0.004, x0 + 0.25, y + 0.004, x0 + rng.range(0.3, 0.6), y)
    ctx.stroke()
  }
  // sand with foam edge
  const edge = ridgeLine(noise, { base: shore + 0.02, amp: 0.035, freq: 2.2, off: 9, oct: 3, tilt: rng.range(-0.08, 0.08) })
  const sandC: RGB = env.night ? [150, 130, 140] : rng.pick([[240, 220, 196], [244, 214, 200], [236, 222, 190]] as RGB[])
  const sg = ctx.createLinearGradient(0, shore, 0, H)
  sg.addColorStop(0, css(mix(sandC, [210, 200, 190], 0.3)))
  sg.addColorStop(1, css(sandC))
  // wet sand band + foam
  fillUnder(ctx, edge.map(([x, y]) => [x, y - 0.012] as [number, number]), H + 0.01, css([255, 255, 252], 0.85))
  fillUnder(ctx, edge, H + 0.01, css(mix(sandC, [170, 170, 170], 0.35)))
  fillUnder(ctx, edge.map(([x, y]) => [x, y + 0.03] as [number, number]), H + 0.01, sg)
  // a pastel beach umbrella or lifeguard hut
  const k = rng.int(0, 2)
  const ux = rng.chance(0.5) ? rng.range(0.18, 0.35) : rng.range(0.65, 0.82)
  const uy = H - rng.range(0.12, 0.22)
  const shadowDx = (ux - sunX) * 0.25
  if (k === 0) {
    const R = rng.range(0.12, 0.17)
    const stripes: RGB[] = [rng.pick([[240, 120, 130], [110, 170, 200], [250, 190, 90]] as RGB[]), [252, 248, 240]]
    ctx.fillStyle = css([150, 130, 130], 0.3)
    ctx.beginPath(); ctx.ellipse(ux + shadowDx, uy + 0.01, R * 0.95, R * 0.18, 0, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = css([120, 100, 100])
    ctx.lineWidth = 0.004
    ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux + 0.01, uy - R * 1.25); ctx.stroke()
    const n = 8
    const cx = ux + 0.01
    const cy = uy - R * 1.25
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI + (i / n) * Math.PI
      const a1 = Math.PI + ((i + 1) / n) * Math.PI
      ctx.fillStyle = css(stripes[i % 2])
      ctx.beginPath()
      ctx.moveTo(cx, cy - R * 0.08)
      ctx.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R * 0.45 + R * 0.12)
      ctx.quadraticCurveTo(cx + Math.cos((a0 + a1) / 2) * R * 1.02, cy + Math.sin((a0 + a1) / 2) * R * 0.42 + R * 0.2, cx + Math.cos(a1) * R, cy + Math.sin(a1) * R * 0.45 + R * 0.12)
      ctx.closePath()
      ctx.fill()
    }
  } else if (k === 1) {
    const w = 0.09
    const hh = 0.2
    const body: RGB = rng.pick([[236, 150, 150], [120, 180, 196], [250, 200, 120]] as RGB[])
    ctx.strokeStyle = css([200, 190, 180])
    ctx.lineWidth = 0.004
    for (const dx of [-w / 2, w / 2]) { ctx.beginPath(); ctx.moveTo(ux + dx, uy); ctx.lineTo(ux + dx * 0.7, uy - hh * 0.55); ctx.stroke() }
    ctx.fillStyle = css(body)
    ctx.fillRect(ux - w * 0.45, uy - hh, w * 0.9, hh * 0.45)
    ctx.fillStyle = css([252, 246, 236])
    ctx.fillRect(ux - w * 0.3, uy - hh * 0.9, w * 0.25, hh * 0.18)
    ctx.beginPath(); ctx.moveTo(ux - w * 0.6, uy - hh); ctx.lineTo(ux, uy - hh * 1.25); ctx.lineTo(ux + w * 0.6, uy - hh); ctx.closePath()
    ctx.fillStyle = css(scale(body, 0.85)); ctx.fill()
  } else {
    // two deck chairs
    for (let i = 0; i < 2; i++) {
      const x = ux + i * 0.12
      const c: RGB = rng.pick([[240, 150, 140], [130, 180, 200], [244, 206, 120]] as RGB[])
      ctx.fillStyle = css([150, 130, 130], 0.25)
      ctx.beginPath(); ctx.ellipse(x + shadowDx, uy + 0.005, 0.06, 0.012, 0, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = css([170, 140, 110]); ctx.lineWidth = 0.003
      ctx.beginPath(); ctx.moveTo(x - 0.04, uy); ctx.lineTo(x + 0.03, uy - 0.07); ctx.moveTo(x + 0.04, uy); ctx.lineTo(x - 0.02, uy - 0.04); ctx.stroke()
      ctx.fillStyle = css(c)
      ctx.beginPath(); ctx.moveTo(x - 0.035, uy - 0.025); ctx.lineTo(x + 0.03, uy - 0.07); ctx.lineTo(x + 0.04, uy - 0.06); ctx.lineTo(x - 0.02, uy - 0.015); ctx.closePath(); ctx.fill()
    }
  }
  // gulls
  if (rng.chance(0.6)) {
    ctx.strokeStyle = css([110, 100, 110], 0.7)
    ctx.lineWidth = 0.0018
    for (let i = 0; i < rng.int(1, 4); i++) {
      const x = rng.range(0.1, 0.9)
      const y = rng.range(0.1, horizon * 0.8)
      const z = rng.range(0.008, 0.016)
      ctx.beginPath(); ctx.moveTo(x - z, y); ctx.quadraticCurveTo(x - z * 0.4, y - z * 0.6, x, y + z * 0.1); ctx.quadraticCurveTo(x + z * 0.4, y - z * 0.6, x + z, y); ctx.stroke()
    }
  }
}

function pool(s: Scene): void {
  const { ctx, rng, H, noise, pw, env } = s
  // top-down-ish pool with tiled edge, caustics, ladder & inflatable
  const edgeY = H * rng.range(0.16, 0.3)
  const tile: RGB = [246, 238, 226]
  ctx.fillStyle = css(tile)
  ctx.fillRect(0, 0, 1, H)
  for (let x = 0; x < 1; x += 0.05) for (let y = 0; y < edgeY; y += 0.05) {
    ctx.strokeStyle = css([210, 200, 190], 0.6); ctx.lineWidth = 0.0015; ctx.strokeRect(x, y, 0.05, 0.05)
  }
  const water: RGB = env.night ? [40, 90, 130] : rng.pick([[96, 196, 214], [110, 206, 206], [120, 190, 226]] as RGB[])
  const ox = rng.range(0, 40)
  const f = fieldSurface(Math.round(pw / 3), Math.round((pw / 3) * (H - edgeY)), H, (u, v, o) => {
    const wx = fbm(noise, u * 3 + ox, v * 3, 2) * 0.25
    const c = ridged(noise, (u + wx) * 7 + ox, (v + wx) * 7, 3, 2, 0.5)
    const c2 = Math.pow(c, 4)
    const d = (v - edgeY) / (H - edgeY)
    const base = mix(mix(water, [60, 150, 186], d * 0.5), [255, 255, 255], c2 * 0.45)
    o[0] = base[0] / 255; o[1] = base[1] / 255; o[2] = base[2] / 255
  }, edgeY, H)
  ctx.drawImage(f.canvas, 0, edgeY, 1, H - edgeY)
  // coping stones & shadow
  ctx.fillStyle = css([255, 250, 242]); ctx.fillRect(0, edgeY - 0.03, 1, 0.03)
  const sh = ctx.createLinearGradient(0, edgeY, 0, edgeY + 0.06)
  sh.addColorStop(0, css([20, 70, 100], 0.4)); sh.addColorStop(1, css([20, 70, 100], 0))
  ctx.fillStyle = sh; ctx.fillRect(0, edgeY, 1, 0.06)
  // ladder
  const lx = rng.range(0.15, 0.85)
  ctx.strokeStyle = css([235, 238, 240]); ctx.lineWidth = 0.008; ctx.lineCap = 'round'
  for (const dx of [0, 0.07]) {
    ctx.beginPath(); ctx.moveTo(lx + dx, edgeY - 0.05); ctx.quadraticCurveTo(lx + dx, edgeY - 0.09, lx + dx + 0.03, edgeY - 0.06); ctx.moveTo(lx + dx, edgeY - 0.05); ctx.lineTo(lx + dx, edgeY + 0.15); ctx.stroke()
  }
  ctx.strokeStyle = css([40, 110, 140], 0.25)
  for (const dx of [0.01, 0.08]) { ctx.beginPath(); ctx.moveTo(lx + dx, edgeY + 0.16); ctx.lineTo(lx + dx + 0.01, edgeY + 0.26); ctx.stroke() }
  // float ring
  if (rng.chance(0.8)) {
    const fx = rng.range(0.25, 0.75)
    const fy = rng.range(edgeY + 0.25, H - 0.2)
    const R = rng.range(0.07, 0.11)
    ctx.fillStyle = css([20, 80, 110], 0.25)
    ctx.beginPath(); ctx.ellipse(fx + 0.03, fy + 0.05, R, R * 0.9, 0, 0, Math.PI * 2); ctx.ellipse(fx + 0.03, fy + 0.05, R * 0.5, R * 0.45, 0, 0, Math.PI * 2); ctx.fill('evenodd')
    const c: RGB = rng.pick([[246, 130, 150], [255, 196, 90], [255, 255, 250]] as RGB[])
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = css(i % 2 ? [255, 252, 246] : c)
      ctx.beginPath()
      ctx.arc(fx, fy, R, (i / 8) * Math.PI * 2, ((i + 1) / 8) * Math.PI * 2)
      ctx.arc(fx, fy, R * 0.5, ((i + 1) / 8) * Math.PI * 2, (i / 8) * Math.PI * 2, true)
      ctx.closePath(); ctx.fill()
    }
    ctx.fillStyle = css([255, 255, 255], 0.5)
    ctx.beginPath(); ctx.ellipse(fx - R * 0.45, fy - R * 0.5, R * 0.2, R * 0.08, -0.7, 0, Math.PI * 2); ctx.fill()
  }
  // palm shadow across the water
  if (rng.chance(0.6)) {
    ctx.fillStyle = css([20, 70, 100], 0.18)
    const px = rng.range(0.6, 1.1)
    const py = rng.range(edgeY + 0.2, H - 0.1)
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2
      ctx.save(); ctx.translate(px, py); ctx.rotate(a)
      ctx.beginPath(); ctx.ellipse(0.12, 0, 0.13, 0.025, 0, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    }
  }
}

function dunes(s: Scene): void {
  const { ctx, rng, H, noise, env } = s
  const horizon = H * rng.range(0.45, 0.6)
  const sunX = rng.range(0.2, 0.8)
  const sunY = horizon * rng.range(0.4, 0.8)
  const { hor } = pastelSky(s, horizon, sunX, sunY)
  const cols: RGB[] = env.night
    ? [[150, 130, 160], [120, 100, 140], [90, 80, 120]]
    : [mix([246, 200, 180], hor, 0.4), [240, 186, 160], [228, 170, 150], [214, 156, 140]]
  for (let i = 0; i < cols.length; i++) {
    const t = i / (cols.length - 1)
    const pts = ridgeLine(noise, { base: horizon + (H - horizon) * (0.05 + t * 0.55), amp: 0.05 + t * 0.12, freq: 1.4 - t * 0.5, off: i * 7 + 3, oct: 2, tilt: rng.range(-0.2, 0.2) })
    const g = ctx.createLinearGradient(0, horizon, 0, H)
    g.addColorStop(0, css(mix(cols[i], [255, 240, 225], 0.2)))
    g.addColorStop(1, css(scale(cols[i], 0.92)))
    fillUnder(ctx, pts, H + 0.01, g)
    // lee side in soft shadow
    ctx.save()
    fillUnder(ctx, pts, H + 0.01, 'rgba(0,0,0,0)')
    ctx.clip()
    const lee = ridgeLine(noise, { base: horizon + (H - horizon) * (0.05 + t * 0.55) + 0.02, amp: 0.05 + t * 0.12, freq: 1.4 - t * 0.5, off: i * 7 + 3.15, oct: 2 })
    ctx.globalAlpha = 0.35
    fillUnder(ctx, lee, H + 0.01, css(mix(scale(cols[i], 0.85), [190, 150, 190], 0.3)))
    ctx.restore()
  }
  // palms
  const n = rng.int(1, 3)
  const px0 = rng.range(0.15, 0.85)
  for (let i = 0; i < n; i++) {
    const x = px0 + (i - n / 2) * 0.09
    const y = H - rng.range(0.05, 0.2)
    const h = rng.range(0.28, 0.42)
    const lean = rng.range(-0.08, 0.08)
    const trunk: RGB = env.night ? [60, 50, 70] : [150, 120, 120]
    ctx.strokeStyle = css(trunk)
    ctx.lineWidth = 0.012
    ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * 0.3, y - h * 0.5, x + lean, y - h); ctx.stroke()
    const tx = x + lean
    const ty = y - h
    const leafC: RGB = env.night ? [50, 60, 80] : [112, 158, 138]
    ctx.fillStyle = css(leafC)
    for (let k = 0; k < 9; k++) {
      const a = -Math.PI / 2 + (k / 8 - 0.5) * 3.8 + rng.range(-0.1, 0.1)
      const L = rng.range(0.1, 0.16)
      const ex = tx + Math.cos(a) * L
      const ey = ty + Math.sin(a) * L * 0.5 + L * 0.45
      const cx = tx + Math.cos(a) * L * 0.55
      const cy = ty + Math.sin(a) * L * 0.7 - 0.025
      ctx.beginPath()
      ctx.moveTo(tx, ty)
      ctx.quadraticCurveTo(cx, cy - 0.012, ex, ey)
      ctx.quadraticCurveTo(cx, cy + 0.016, tx, ty + 0.004)
      ctx.fill()
    }
  }
}

function draw(s: Scene): void {
  const v = s.rng.int(0, 2)
  if (v === 0) seaside(s)
  else if (v === 1) pool(s)
  else dunes(s)
}

export const polaroid: FilmImpl = {
  meta: {
    id: 'polaroid',
    name: 'Полароид',
    short: 'POLAROID 600',
    description: 'Пастель, мягкий фокус и выцветшие краски',
    swatch: ['#f2c9c0', '#9fcfd6', '#f6e7c8'],
  },
  paper: [241, 237, 228],
  devTone: [214, 222, 214],
  devMono: 0.7,
  draw,
  grade: (env) =>
    baseGrade({
      contrast: -0.05,
      lift: [0.12, 0.14, 0.15],
      gain: [0.99 + env.warmth * 0.02, 0.96, 0.88],
      gamma: [0.95, 0.98, 1.0],
      sat: 0.78,
      shadowTint: [-0.03, 0.03, 0.04],
      highlightTint: [0.03, 0.02, -0.02],
      grain: 0.035,
      grainChroma: 0.4,
      grainClump: 0.1,
      vignette: 0.28,
      vignetteTint: [0.05, 0.02, -0.03],
      soften: 0.55,
      softenRadius: 0.004,
    }),
  bloom: () => [{ radius: 0.05, strength: 0.6, tint: [255, 236, 220] }],
}
