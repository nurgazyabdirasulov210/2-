// Цианотипия — botanical photogram: plant silhouettes on brushed Prussian-blue paper.
import { blurSurface, createSurface, fieldSurface, type Ctx } from '../canvas'
import { fbm } from '../noise'
import type { Rng } from '../rng'
import { baseGrade, type FilmImpl, type Scene } from '../types'
import { clamp, css, mix, type RGB } from '../util'

const W: RGB = [255, 255, 255]

function leafPath(ctx: Ctx, len: number, wid: number, shape: number): void {
  // leaf along +x from origin; shape 0 = lanceolate, 1 = ovate
  const b = 0.25 + shape * 0.2
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(len * b, -wid * 1.1, len * (0.55 + shape * 0.15), -wid, len, 0)
  ctx.bezierCurveTo(len * (0.55 + shape * 0.15), wid, len * b, wid * 1.1, 0, 0)
  ctx.closePath()
}

function leaf(ctx: Ctx, rng: Rng, x: number, y: number, ang: number, len: number, wid: number, op: number, veins = true): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(ang)
  const shape = rng.float()
  leafPath(ctx, len, wid, shape)
  ctx.fillStyle = css(W, op * 0.5)
  ctx.fill()
  if (veins && len > 0.03) {
    ctx.strokeStyle = css(W, op * 0.7)
    ctx.lineWidth = len * 0.018
    ctx.beginPath()
    ctx.moveTo(-len * 0.08, 0)
    ctx.lineTo(len * 0.95, 0)
    ctx.stroke()
    const n = Math.round(5 + len * 60)
    ctx.lineWidth = len * 0.008
    for (let i = 1; i < n; i++) {
      const t = i / n
      const px = t * len * 0.9
      const w = wid * Math.sin(Math.PI * Math.min(1, t * 1.05)) * 0.85
      for (const s of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(px, 0)
        ctx.quadraticCurveTo(px + len * 0.06, s * w * 0.5, px + len * 0.14, s * w * 0.9)
        ctx.stroke()
      }
    }
  }
  ctx.restore()
}

function fern(ctx: Ctx, rng: Rng, x: number, y: number, ang: number, len: number, op: number): void {
  const curve = rng.range(-0.5, 0.5)
  const pinnae = rng.int(16, 24)
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(ang)
  // rachis
  ctx.strokeStyle = css(W, op)
  ctx.lineWidth = len * 0.012
  ctx.lineCap = 'round'
  const pt = (t: number): [number, number] => [t * len, Math.sin(t * 2.2) * curve * len * 0.18 * t]
  ctx.beginPath()
  for (let i = 0; i <= 40; i++) {
    const [px, py] = pt(i / 40)
    if (i === 0) ctx.moveTo(px - len * 0.15, py)
    ctx.lineTo(px, py)
  }
  ctx.stroke()
  for (let i = 0; i < pinnae; i++) {
    const t = 0.08 + (i / pinnae) * 0.9
    const [px, py] = pt(t)
    const pl = len * 0.24 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.05)), 0.8) * (1 - t * 0.35)
    for (const side of [-1, 1]) {
      const a = side * (1.0 - t * 0.35) + curve * 0.2
      ctx.save()
      ctx.translate(px + side * len * 0.004, py)
      ctx.rotate(a)
      // pinna: lobed narrow leaflet
      const k = Math.max(3, Math.round(pl / (len * 0.018)))
      ctx.fillStyle = css(W, op * 0.8)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      for (let j = 0; j <= k; j++) {
        const u = j / k
        const wv = pl * 0.075 * (1 - u * 0.8) * (j % 2 ? 1 : 0.6)
        ctx.lineTo(u * pl, -wv)
      }
      for (let j = k; j >= 0; j--) {
        const u = j / k
        const wv = pl * 0.075 * (1 - u * 0.8) * (j % 2 ? 1 : 0.6)
        ctx.lineTo(u * pl, wv)
      }
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = css(W, op)
      ctx.lineWidth = len * 0.004
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(pl, 0)
      ctx.stroke()
      ctx.restore()
    }
  }
  ctx.restore()
}

function grass(ctx: Ctx, rng: Rng, x: number, y: number, ang: number, len: number, op: number): void {
  const bend = rng.range(-0.25, 0.25)
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(ang)
  ctx.strokeStyle = css(W, op)
  ctx.lineWidth = len * 0.008
  ctx.lineCap = 'round'
  const cx = len * 0.5
  const cy = bend * len * 0.5
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(cx, cy, len, bend * len * 0.35)
  ctx.stroke()
  const kind = rng.int(0, 2)
  const n = rng.int(10, 22)
  for (let i = 0; i < n; i++) {
    const t = 0.6 + (i / n) * 0.4
    const px = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * cx + t * t * len
    const py = 2 * (1 - t) * t * cy + t * t * bend * len * 0.35
    const s = i % 2 ? 1 : -1
    ctx.fillStyle = css(W, op * 0.9)
    ctx.beginPath()
    if (kind === 0) ctx.ellipse(px + len * 0.01, py + s * len * 0.012, len * 0.022, len * 0.007, s * 0.6, 0, Math.PI * 2)
    else if (kind === 1) ctx.ellipse(px, py, len * 0.012, len * 0.012 * (1.4 - t), 0, 0, Math.PI * 2)
    else {
      ctx.ellipse(px + len * 0.015, py + s * len * 0.025, len * 0.03, len * 0.004, s * 0.9, 0, Math.PI * 2)
    }
    ctx.fill()
  }
  // a couple of blades
  for (let i = 0; i < 2; i++) {
    ctx.save()
    ctx.rotate(rng.range(-0.25, 0.25))
    leafPath(ctx, len * rng.range(0.3, 0.6), len * 0.012, 0)
    ctx.fillStyle = css(W, op * 0.8)
    ctx.fill()
    ctx.restore()
  }
  ctx.restore()
}

function umbel(ctx: Ctx, rng: Rng, x: number, y: number, ang: number, len: number, op: number): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(ang)
  ctx.strokeStyle = css(W, op)
  ctx.lineCap = 'round'
  ctx.lineWidth = len * 0.01
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(len * 0.5, rng.range(-0.06, 0.06) * len, len * 0.78, 0)
  ctx.stroke()
  const rays = rng.int(9, 15)
  const R = len * rng.range(0.16, 0.24)
  for (let i = 0; i < rays; i++) {
    const a = -0.9 + (i / (rays - 1)) * 1.8 + rng.range(-0.05, 0.05)
    const ex = len * 0.78 + Math.cos(a) * R
    const ey = Math.sin(a) * R
    ctx.lineWidth = len * 0.004
    ctx.beginPath()
    ctx.moveTo(len * 0.78, 0)
    ctx.lineTo(ex, ey)
    ctx.stroke()
    const sub = rng.int(6, 10)
    for (let j = 0; j < sub; j++) {
      const b = a - 0.8 + (j / (sub - 1)) * 1.6
      const fx = ex + Math.cos(b) * R * 0.22
      const fy = ey + Math.sin(b) * R * 0.22
      ctx.lineWidth = len * 0.002
      ctx.beginPath()
      ctx.moveTo(ex, ey)
      ctx.lineTo(fx, fy)
      ctx.stroke()
      ctx.fillStyle = css(W, op)
      ctx.beginPath()
      ctx.arc(fx, fy, len * 0.007, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

function ginkgo(ctx: Ctx, rng: Rng, x: number, y: number, ang: number, size: number, op: number): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(ang)
  ctx.strokeStyle = css(W, op)
  ctx.lineWidth = size * 0.04
  ctx.beginPath()
  ctx.moveTo(-size * 0.7, 0)
  ctx.lineTo(0, 0)
  ctx.stroke()
  const spread = rng.range(0.8, 1.15)
  const notch = rng.chance(0.6) ? 0.09 : 0
  ctx.beginPath()
  ctx.moveTo(0, 0)
  if (notch) {
    ctx.arc(0, 0, size, -spread, -notch)
    ctx.lineTo(size * 0.6, 0)
    ctx.arc(0, 0, size, notch, spread)
  } else ctx.arc(0, 0, size, -spread, spread)
  ctx.closePath()
  ctx.fillStyle = css(W, op * 0.6)
  ctx.fill()
  ctx.lineWidth = size * 0.008
  ctx.strokeStyle = css(W, op * 0.5)
  for (let i = 0; i < 22; i++) {
    const a = -spread + (i / 21) * spread * 2
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(a) * size * 0.98, Math.sin(a) * size * 0.98)
    ctx.stroke()
  }
  ctx.restore()
}

function daisy(ctx: Ctx, rng: Rng, x: number, y: number, ang: number, len: number, op: number): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(ang)
  ctx.strokeStyle = css(W, op)
  ctx.lineWidth = len * 0.009
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(len * 0.5, rng.range(-0.08, 0.08) * len, len, 0)
  ctx.stroke()
  const r = len * rng.range(0.07, 0.11)
  const petals = rng.int(12, 20)
  ctx.translate(len + r * 0.3, 0)
  for (let i = 0; i < petals; i++) {
    ctx.save()
    ctx.rotate((i / petals) * Math.PI * 2 + rng.range(-0.05, 0.05))
    ctx.fillStyle = css(W, op * 0.62)
    ctx.beginPath()
    ctx.ellipse(r * 0.95, 0, r * 0.75, r * 0.16, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  ctx.fillStyle = css(W, op)
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function stemWithLeaves(ctx: Ctx, rng: Rng, x: number, y: number, ang: number, len: number, op: number): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(ang)
  ctx.strokeStyle = css(W, op)
  ctx.lineWidth = len * 0.01
  ctx.lineCap = 'round'
  const bend = rng.range(-0.15, 0.15) * len
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(len * 0.5, bend, len, bend * 0.4)
  ctx.stroke()
  const n = rng.int(4, 8)
  for (let i = 0; i < n; i++) {
    const t = 0.25 + (i / n) * 0.75
    const px = t * len
    const py = 2 * (1 - t) * t * bend + t * t * bend * 0.4
    const side = i % 2 ? 1 : -1
    const ll = len * rng.range(0.12, 0.2) * (1.1 - t * 0.5)
    leaf(ctx, rng, px, py, side * rng.range(0.5, 0.9), ll, ll * 0.3, op, ll > 0.04)
  }
  leaf(ctx, rng, len, bend * 0.4, rng.range(-0.2, 0.2), len * 0.14, len * 0.04, op, false)
  ctx.restore()
}

function draw(s: Scene): void {
  const { ctx, rng, noise, H, env, pw } = s
  // ---- paper
  ctx.fillStyle = css([241, 236, 220])
  ctx.fillRect(0, 0, 1, H)
  const fr = rng.fork('fibres')
  for (let i = 0; i < 900; i++) {
    const x = fr.float()
    const y = fr.float() * H
    const a = fr.range(0, Math.PI)
    const l = fr.range(0.003, 0.012)
    ctx.strokeStyle = css([170, 150, 120], fr.range(0.04, 0.12))
    ctx.lineWidth = s.px
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l)
    ctx.stroke()
  }

  // ---- brushed emulsion, on its own layer
  const E = createSurface(pw, Math.round(H * pw))
  const e = E.ctx
  e.setTransform(pw, 0, 0, pw, 0, 0)
  const m = rng.range(0.05, 0.08)
  const top = m * rng.range(0.9, 1.4)
  const bottom = H - m * rng.range(1.0, 1.6)
  const expo = clamp(0.55 + env.sunElev * 0.35 + (env.night ? -0.2 : 0) - (Number.isNaN(env.clouds) ? 0 : env.clouds * 0.15), 0.25, 1)
  const deep: RGB = mix([30, 70, 128], [10, 34, 84], expo)
  const mid: RGB = mix([56, 100, 152], [22, 62, 120], expo)
  // ragged brushed outline
  const ex = rng.range(0, 50)
  const edge = (t: number, k: number) => fbm(noise, t * 9 + ex + k * 7, k * 3.1, 4) * 0.012 + fbm(noise, t * 40 + k, ex, 2) * 0.004
  e.fillStyle = css(deep)
  e.beginPath()
  const N = 120
  for (let i = 0; i <= N; i++) { const t = i / N; e.lineTo(m + t * (1 - 2 * m), top + edge(t, 0)) }
  for (let i = 0; i <= N; i++) { const t = i / N; e.lineTo(1 - m + edge(t, 1) * 1.6, top + t * (bottom - top)) }
  for (let i = N; i >= 0; i--) { const t = i / N; e.lineTo(m + t * (1 - 2 * m), bottom + edge(t, 2)) }
  for (let i = N; i >= 0; i--) { const t = i / N; e.lineTo(m + edge(t, 3) * 1.6, top + t * (bottom - top)) }
  e.closePath()
  e.fill()
  // dry-brush bristles escaping the left & right edges
  e.lineCap = 'butt'
  for (let k = 0; k < 150; k++) {
    const t = rng.float()
    const yy = top + t * (bottom - top)
    const left = k % 2 === 0
    const xe = left ? m + edge(t, 3) * 1.6 : 1 - m + edge(t, 1) * 1.6
    const l = Math.pow(rng.float(), 2.5) * 0.035
    e.lineWidth = rng.range(0.0006, 0.0028)
    e.strokeStyle = css(mix(deep, mid, rng.float()), rng.range(0.35, 0.9))
    e.beginPath()
    e.moveTo(xe + (left ? 0.004 : -0.004), yy)
    e.lineTo(xe + (left ? -l : l), yy + rng.range(-0.002, 0.002))
    e.stroke()
  }
  // fill interior solidly + mottling
  const ox = rng.range(0, 99)
  const mot = fieldSurface(Math.round(pw / 5), Math.round((pw / 5) * H), H, (u, v, o) => {
    const n = fbm(noise, u * 5 + ox, v * 5, 5) * 0.5 + 0.5
    const streak = fbm(noise, u * 1.5 + ox, v * 26, 3) * 0.5 + 0.5
    const c = mix(mix(deep, mid, n * 0.9), [70, 120, 170], Math.pow(streak, 3) * 0.3)
    o[0] = c[0] / 255; o[1] = c[1] / 255; o[2] = c[2] / 255; o[3] = 0.85
  })
  e.globalCompositeOperation = 'source-atop'
  e.drawImage(mot.canvas, 0, 0, 1, H)

  // ---- botanicals (photogram) on a mask layer
  const P = createSurface(pw, Math.round(H * pw))
  const p = P.ctx
  p.setTransform(pw, 0, 0, pw, 0, 0)
  const layout = rng.int(0, 2)
  const cx = rng.range(0.35, 0.65)
  if (layout === 0) {
    // ferns hero
    const n = rng.int(1, 3)
    for (let i = 0; i < n; i++) {
      const bx = cx + rng.range(-0.25, 0.25)
      fern(p, rng, bx, H * rng.range(0.85, 1.0), -Math.PI / 2 + rng.range(-0.45, 0.45), H * rng.range(0.55, 0.78) / (1 + i * 0.25), 0.95)
    }
    for (let i = 0; i < rng.int(2, 5); i++) grass(p, rng, rng.range(0.1, 0.9), H * 0.98, -Math.PI / 2 + rng.range(-0.5, 0.5), H * rng.range(0.35, 0.65), 0.9)
  } else if (layout === 1) {
    // bouquet rising from a point
    const n = rng.int(6, 11)
    const by = H + 0.02
    const fan = rng.range(0.5, 1.0)
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1) - 0.5
      const a = -Math.PI / 2 + t * fan + rng.range(-0.12, 0.12)
      const len = H * rng.range(0.5, 0.85)
      const kind = rng.int(0, 4)
      const fn = [grass, umbel, daisy, stemWithLeaves, grass][kind]
      fn(p, rng, cx + t * rng.range(0.2, 0.5), by, a, len, 0.92)
    }
  } else {
    // scattered leaves
    const n = rng.int(10, 16)
    const fav = rng.int(0, 3)
    for (let i = 0; i < n; i++) {
      const x = rng.range(0.1, 0.9)
      const y = rng.range(0.1, H - 0.1)
      const a = rng.range(0, Math.PI * 2)
      const k = rng.chance(0.45) ? fav : rng.int(0, 3)
      if (k === 0) ginkgo(p, rng, x, y, a, rng.range(0.08, 0.14), 0.9)
      else if (k === 1) leaf(p, rng, x, y, a, rng.range(0.16, 0.3), rng.range(0.035, 0.07), 0.9)
      else if (k === 2) stemWithLeaves(p, rng, x, y, a, rng.range(0.25, 0.42), 0.9)
      else daisy(p, rng, x, y, a, rng.range(0.15, 0.28), 0.9)
    }
  }
  // penumbra: soft copy + sharp copy, slightly bluish whites
  const soft = blurSurface(P, pw * 0.006)
  e.setTransform(1, 0, 0, 1, 0, 0)
  e.globalCompositeOperation = 'source-atop'
  e.globalAlpha = 0.85
  e.drawImage(soft.canvas, 0, 0)
  e.globalAlpha = 0.8
  e.drawImage(P.canvas, 0, 0)
  e.globalAlpha = 1
  e.fillStyle = css([150, 190, 220], 0.18)
  e.globalCompositeOperation = 'source-atop'
  e.fillRect(0, 0, E.w, E.h)
  // composite emulsion onto paper
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.drawImage(E.canvas, 0, 0)
  ctx.restore()
}

export const cyan: FilmImpl = {
  meta: {
    id: 'cyan',
    name: 'Цианотипия',
    short: 'CYANOTYPE',
    description: 'Синий отпечаток: силуэты трав и листьев',
    swatch: ['#183f7a', '#5d8fbf', '#efe9da'],
  },
  paper: [236, 232, 214],
  devTone: [150, 175, 205],
  devMono: 0.3,
  draw,
  grade: () =>
    baseGrade({
      contrast: 0.12,
      lift: [0.02, 0.03, 0.06],
      gain: [0.98, 0.99, 1],
      sat: 1.05,
      grain: 0.045,
      grainChroma: 0.15,
      grainClump: 0.55,
      vignette: 0.16,
      vignetteTint: [-0.02, -0.01, 0.01],
    }),
  bloom: () => [],
  precipTone: [225, 235, 245],
}
