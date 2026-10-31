// Синестилл 800T — rainy neon night street, tungsten palette, red halation around lights.
import { blurSurface, createSurface, fieldSurface, type Ctx } from '../canvas'
import { cloudiness } from '../env'
import { fbm } from '../noise'
import { baseGrade, type FilmImpl, type Scene } from '../types'
import { clamp, css, mix, scale, type RGB } from '../util'
import { glowDot } from './common'

const NEON: RGB[] = [
  [255, 64, 160], [60, 226, 255], [255, 48, 56], [255, 168, 40], [90, 255, 150], [176, 96, 255], [255, 236, 220],
]
const WORDS = ['БАР', 'КИНО', 'ОТЕЛЬ', 'АПТЕКА', '24', 'КАФЕ', 'ДИСКО', 'РЮМОЧНАЯ', 'ЦВЕТЫ', 'НОЧЬ', 'ВИНО', 'ПЕЛЬМЕНИ', 'ГОСТИНИЦА', 'ЛОМБАРД', 'ТИР']
const FONT = '"Arial Narrow", "Roboto Condensed", "Helvetica Neue", Arial, sans-serif'

interface Cam { vx: number; hy: number; f: number; camH: number; camX: number }

function draw(s: Scene): void {
  const { ctx, glow, rng, noise, env, H, pw } = s
  const cam: Cam = { vx: rng.range(0.4, 0.6), hy: H * rng.range(0.5, 0.6), f: rng.range(0.55, 0.75), camH: 1.6, camX: rng.range(-1.8, 1.8) }
  const P = (X: number, Y: number, Z: number): [number, number] => [cam.vx + (cam.f * (X - cam.camX)) / Z, cam.hy - (cam.f * (Y - cam.camH)) / Z]
  const ROAD = rng.range(4.2, 6)
  const FAC = ROAD + rng.range(2.2, 3.4)
  const ZN = 3
  const ZF = 260
  const cloud = cloudiness(env, rng.range(0.4, 0.9))
  const twilight = env.dusk * 0.8
  const pal = [rng.pick(NEON), rng.pick(NEON), rng.pick(NEON)]
  const lampC: RGB = rng.chance(0.7) ? [255, 158, 72] : [210, 228, 255]

  // reflection layer (wet asphalt)
  const R = createSurface(pw, Math.round(H * pw))
  const r = R.ctx
  r.setTransform(pw, 0, 0, pw, 0, 0)

  // ---- sky
  const sky = ctx.createLinearGradient(0, 0, 0, cam.hy)
  sky.addColorStop(0, css(mix([6, 9, 20], [20, 34, 70], twilight)))
  sky.addColorStop(0.7, css(mix([22, 22, 38], [50, 60, 100], twilight)))
  sky.addColorStop(1, css(mix([70, 44, 48], [120, 90, 110], twilight)))
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, 1, cam.hy + 0.01)
  const ox = rng.range(0, 99)
  const cl = fieldSurface(Math.round(pw / 6), Math.round((pw / 6) * cam.hy), H, (u, v, o) => {
    const n = fbm(noise, u * 2.5 + ox, v * 5, 5) * 0.5 + 0.5
    const c = clamp((n - 0.45 + cloud * 0.2) * 2.5) * (0.4 + 0.6 * (v / cam.hy))
    o[0] = 120 / 255; o[1] = 70 / 255; o[2] = 70 / 255; o[3] = c * 0.35
  }, 0, cam.hy)
  ctx.drawImage(cl.canvas, 0, 0, 1, cam.hy)

  // ---- distant skyline at the end of the street
  {
    const [xl] = P(-FAC, 0, ZF)
    const [xr] = P(FAC, 0, ZF)
    const span = (xr - xl) * 4
    let x = cam.vx - span / 2
    while (x < cam.vx + span / 2) {
      const w = rng.range(0.004, 0.012)
      const h = rng.range(0.01, 0.05)
      ctx.fillStyle = css([28, 24, 36])
      ctx.fillRect(x, cam.hy - h, w, h + 0.002)
      for (let i = 0; i < 4; i++) if (rng.chance(0.5)) {
        ctx.fillStyle = css(rng.pick([[255, 200, 140], [200, 220, 255]] as RGB[]), 0.7)
        ctx.fillRect(x + rng.range(0, w), cam.hy - rng.range(0, h), s.px * 1.2, s.px * 1.2)
      }
      x += w
    }
    glowDot(glow, cam.vx, cam.hy, 0.12, [255, 140, 90], 0.35)
  }

  // ---- ground
  const [, yb] = P(0, 0, ZN)
  const road = ctx.createLinearGradient(0, cam.hy, 0, H)
  road.addColorStop(0, css([40, 32, 38]))
  road.addColorStop(0.1, css([18, 17, 22]))
  road.addColorStop(1, css([12, 12, 16]))
  ctx.fillStyle = road
  ctx.fillRect(0, cam.hy, 1, Math.max(yb, H) - cam.hy + 0.01)
  const quad = (c: Ctx, a: [number, number], b: [number, number], cc: [number, number], d: [number, number]) => {
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(cc[0], cc[1]); c.lineTo(d[0], d[1]); c.closePath()
  }
  for (const side of [-1, 1]) {
    quad(ctx, P(side * ROAD, 0, 1.2), P(side * FAC, 0, 1.2), P(side * FAC, 0, ZF), P(side * ROAD, 0, ZF))
    ctx.fillStyle = css([28, 26, 32])
    ctx.fill()
    // curb
    quad(ctx, P(side * ROAD, 0, 1.2), P(side * ROAD, 0.15, 1.2), P(side * ROAD, 0.15, ZF), P(side * ROAD, 0, ZF))
    ctx.fillStyle = css([50, 46, 52])
    ctx.fill()
  }
  // sky glow mirrored on the wet asphalt
  {
    const g = ctx.createLinearGradient(0, cam.hy, 0, H)
    g.addColorStop(0, css([110, 70, 80], 0.35 + env.rain * 0.2))
    g.addColorStop(0.4, css([40, 40, 70], 0.12))
    g.addColorStop(1, css([20, 20, 40], 0.05))
    ctx.fillStyle = g
    ctx.fillRect(0, cam.hy, 1, H - cam.hy)
  }
  // lane dashes
  for (let z = 4; z < 120; z += 9) {
    quad(ctx, P(-0.08, 0, z), P(0.08, 0, z), P(0.08, 0, z + 4), P(-0.08, 0, z + 4))
    ctx.fillStyle = css([150, 140, 120], 0.35)
    ctx.fill()
  }

  // reflection helper: a vertical smear below the mirrored point
  const refl = (X: number, Y: number, Z: number, c: RGB, a: number, wid: number) => {
    const [x, y0] = P(X, 0, Z)
    const [, ym] = P(X, -Y, Z)
    const len = (ym - y0) * 1.7 + 0.015
    const g = r.createLinearGradient(0, y0, 0, y0 + len)
    g.addColorStop(0, css(c, a * 0.9))
    g.addColorStop(0.35, css(c, a * 0.5))
    g.addColorStop(1, css(c, 0))
    r.fillStyle = g
    const w = Math.max(wid, 0.002)
    // broken into ripples
    const steps = Math.max(4, Math.round(len / 0.004))
    for (let i = 0; i < steps; i++) {
      const yy = y0 + (i / steps) * len
      const jit = (fbm(noise, x * 40 + i * 0.7, yy * 90, 2)) * w * 0.9
      const ww = w * (0.55 + 0.6 * (fbm(noise, yy * 120, x * 30, 2) * 0.5 + 0.5))
      r.fillRect(x - ww / 2 + jit, yy, ww, (len / steps) * 0.8)
    }
  }

  // ---- buildings
  const signs: { side: number; Z: number; word: string; c: RGB; y0: number; len: number }[] = []
  for (const side of [-1, 1]) {
    const segs: { z0: number; z1: number; h: number; col: RGB }[] = []
    let z = ZN - 1
    while (z < ZF) {
      const len = rng.range(8, 22) * (1 + z / 120)
      segs.push({ z0: z, z1: z + len, h: rng.range(9, 30), col: mix([22, 20, 28], [44, 34, 44], rng.float()) })
      z += len
    }
    for (let i = segs.length - 1; i >= 0; i--) {
      const sg = segs[i]
      const X = side * FAC
      quad(ctx, P(X, 0, sg.z0), P(X, sg.h, sg.z0), P(X, sg.h, sg.z1), P(X, 0, sg.z1))
      const [ga, gb] = [P(X, sg.h, sg.z0), P(X, 0, sg.z0)]
      const fg = ctx.createLinearGradient(0, ga[1], 0, gb[1])
      fg.addColorStop(0, css(scale(sg.col, 0.7)))
      fg.addColorStop(1, css(mix(sg.col, [90, 50, 50], 0.25)))
      ctx.fillStyle = fg
      ctx.fill()
      // cornice
      quad(ctx, P(X, sg.h, sg.z0), P(X, sg.h + 0.5, sg.z0), P(X, sg.h + 0.5, sg.z1), P(X, sg.h, sg.z1))
      ctx.fillStyle = css(scale(sg.col, 0.5))
      ctx.fill()
      // windows
      const near = sg.z0 < 70
      for (let y = 4.2; y < sg.h - 1.5; y += 3.2) {
        for (let wz = sg.z0 + 1; wz < sg.z1 - 1.5; wz += 2.7) {
          const lit = rng.chance(0.28)
          const wc: RGB = lit ? rng.pick([[255, 190, 110], [255, 214, 160], [255, 170, 90], [150, 200, 255], [200, 255, 220]] as RGB[]) : [30, 30, 44]
          quad(ctx, P(X, y, wz), P(X, y + 1.7, wz), P(X, y + 1.7, wz + 1.3), P(X, y, wz + 1.3))
          ctx.fillStyle = css(lit ? scale(wc, rng.range(0.6, 1)) : wc, lit ? 0.95 : 0.8)
          ctx.fill()
          if (lit && near) {
            quad(glow, P(X, y, wz), P(X, y + 1.7, wz), P(X, y + 1.7, wz + 1.3), P(X, y, wz + 1.3))
            glow.fillStyle = css(wc, 0.25)
            glow.fill()
            if (rng.chance(0.3)) refl(X - side * 0.4, y + 0.8, wz + 0.6, wc, 0.12, 0.004)
          }
        }
      }
      // ground-floor shopfront
      if (rng.chance(0.55) && sg.z0 < 150 && sg.z0 > 7) {
        const z0 = sg.z0 + rng.range(0.5, 2)
        const z1 = Math.min(sg.z1 - 0.5, z0 + rng.range(4, 9))
        const sc = rng.pick([[255, 214, 150], [230, 240, 255], [255, 190, 120]] as RGB[])
        quad(ctx, P(X, 0.3, z0), P(X, 3, z0), P(X, 3, z1), P(X, 0.3, z1))
        ctx.fillStyle = css(sc, 0.92)
        ctx.fill()
        quad(glow, P(X, 0.3, z0), P(X, 3, z0), P(X, 3, z1), P(X, 0.3, z1))
        glow.fillStyle = css(sc, 0.6)
        glow.fill()
        for (let k = 0; k < 4; k++) refl(X - side * 0.2, 1.7, z0 + ((k + 0.5) / 4) * (z1 - z0), sc, 0.3, ((cam.f * 1.5) / ((z0 + z1) / 2)) * 0.6)
        // fascia sign with text, painted on the facade plane (affine approximation)
        if (rng.chance(0.7)) {
          const word = rng.pick(WORDS)
          const c = rng.pick(pal)
          const a = P(X, 4.2, z0)
          const b = P(X, 4.2, z1)
          const d = P(X, 3.3, z0)
          for (const target of [ctx, glow]) {
            target.save()
            target.transform(b[0] - a[0], b[1] - a[1], d[0] - a[0], d[1] - a[1], a[0], a[1])
            target.font = `bold 0.8px ${FONT}`
            target.textBaseline = 'middle'
            target.textAlign = 'center'
            const tw = target.measureText(word).width
            target.scale(Math.min(1 / (tw * 1.15), 0.5), 1)
            const cx = 0.5 / Math.min(1 / (tw * 1.15), 0.5)
            target.fillStyle = css(target === ctx ? mix(c, [255, 255, 255], 0.55) : c, 1)
            target.fillText(word, cx, 0.52)
            target.restore()
          }
          refl(X - side * 0.2, 3.8, (z0 + z1) / 2, c, 0.35, 0.006)
        }
      }
      // protruding blade sign
      if (rng.chance(0.5) && sg.z0 < 90) {
        const word = rng.pick(WORDS.filter((w) => w.length <= 6))
        signs.push({ side, Z: sg.z0 + rng.range(1, 4), word, c: rng.pick(pal), y0: rng.range(4.5, 7), len: Math.max(2.4, word.length * 1.1) })
      }
    }
  }

  // ---- street lamps, blade signs, cars (sorted far -> near)
  type Item = { Z: number; draw: () => void }
  const items: Item[] = []
  const lampStep = rng.range(18, 28)
  const lampOff = rng.range(0, lampStep)
  for (const side of [-1, 1]) {
    for (let z = 6 + lampOff + (side > 0 ? lampStep / 2 : 0); z < 200; z += lampStep) {
      items.push({ Z: z, draw: () => {
        const X = side * (ROAD + 0.4)
        const [px0, py0] = P(X, 0, z)
        const [, py1] = P(X, 7, z)
        const [hx, hy] = P(X - side * 1.6, 7, z)
        const lw = (cam.f * 0.16) / z
        ctx.strokeStyle = css([10, 10, 14])
        ctx.lineWidth = lw
        ctx.beginPath(); ctx.moveTo(px0, py0); ctx.lineTo(px0, py1); ctx.lineTo(hx, hy); ctx.stroke()
        const sz = (cam.f * 0.5) / z
        ctx.fillStyle = css(mix(lampC, [255, 255, 255], 0.6))
        ctx.beginPath(); ctx.ellipse(hx, hy + sz * 0.15, sz * 0.6, sz * 0.22, 0, 0, Math.PI * 2); ctx.fill()
        glowDot(glow, hx, hy, sz * 5, lampC, 1, 0.12)
        glowDot(ctx, hx, hy, sz * 14, lampC, 0.18, 0.05)
        // pool of light on the ground
        const [gx, gy] = P(X - side * 1.6, 0, z)
        ctx.save()
        ctx.translate(gx, gy)
        ctx.scale(1, 0.18)
        glowDot(ctx, 0, 0, sz * 18, lampC, 0.22, 0.2)
        ctx.restore()
        refl(X - side * 1.6, 7, z, lampC, 0.55, sz * 1.4)
      } })
    }
  }
  for (const sg of signs) {
    items.push({ Z: sg.Z, draw: () => {
      const X0 = sg.side * FAC
      const X1 = sg.side * (FAC - 1.1)
      const [ax, ay] = P(X0, sg.y0 + sg.len, sg.Z)
      const [bx, by] = P(X1, sg.y0, sg.Z)
      const x0 = Math.min(ax, bx)
      const wpx = Math.abs(bx - ax)
      const hpx = by - ay
      ctx.fillStyle = css([14, 10, 16])
      ctx.fillRect(x0, ay, wpx, hpx)
      const n = sg.word.length
      const cell = hpx / n
      const fs = Math.min(cell * 0.92, wpx * 1.05)
      for (const target of [ctx, glow]) {
        target.font = `bold ${fs}px ${FONT}`
        target.textAlign = 'center'
        target.textBaseline = 'middle'
        target.fillStyle = target === ctx ? css(mix(sg.c, [255, 255, 255], 0.6)) : css(sg.c)
        for (let i = 0; i < n; i++) target.fillText(sg.word[i], x0 + wpx / 2, ay + cell * (i + 0.55))
        target.strokeStyle = css(sg.c, target === ctx ? 0.9 : 1)
        target.lineWidth = Math.max(s.px, wpx * 0.04)
        target.strokeRect(x0 + wpx * 0.06, ay + wpx * 0.06, wpx * 0.88, hpx - wpx * 0.12)
      }
      glowDot(ctx, x0 + wpx / 2, ay + hpx / 2, hpx * 0.9, sg.c, 0.25, 0.1)
      for (let i = 0; i < 3; i++) refl((X0 + X1) / 2, sg.y0 + sg.len * (i + 0.5) / 3, sg.Z, sg.c, 0.4, wpx * 0.9)
    } })
  }
  const cars = rng.int(0, 4)
  for (let i = 0; i < cars; i++) {
    const away = rng.chance(0.6)
    const z = rng.range(9, 70)
    const X = (away ? 1 : -1) * ROAD * rng.range(0.3, 0.6)
    items.push({ Z: z, draw: () => {
      const [bx0, by0] = P(X - 0.95, 1.45, z)
      const [bx1, by1] = P(X + 0.95, 0.25, z)
      ctx.fillStyle = css([8, 8, 12])
      ctx.beginPath()
      ctx.roundRect(bx0, by0 + (by1 - by0) * 0.35, bx1 - bx0, (by1 - by0) * 0.65, (bx1 - bx0) * 0.08)
      ctx.roundRect(bx0 + (bx1 - bx0) * 0.18, by0, (bx1 - bx0) * 0.64, (by1 - by0) * 0.5, (bx1 - bx0) * 0.12)
      ctx.fill()
      const c: RGB = away ? [255, 30, 40] : [255, 244, 220]
      const sz = (cam.f * (away ? 0.14 : 0.2)) / z
      for (const dx of [-0.75, 0.75]) {
        const [lx, ly] = P(X + dx, 0.85, z)
        ctx.fillStyle = css(mix(c, [255, 255, 255], 0.5))
        ctx.beginPath(); ctx.ellipse(lx, ly, sz, sz * 0.6, 0, 0, Math.PI * 2); ctx.fill()
        glowDot(glow, lx, ly, sz * (away ? 8 : 16), c, 1, 0.15)
        refl(X + dx, 0.85, z, c, away ? 0.6 : 0.8, sz * 2.5)
        if (!away) {
          // headlight beam on the wet road
          const [gx, gy] = P(X + dx, 0, z - 3)
          ctx.save(); ctx.translate(gx, gy); ctx.scale(1, 0.3)
          glowDot(ctx, 0, 0, sz * 20, c, 0.2, 0.2)
          ctx.restore()
        }
      }
    } })
  }
  // overhead wires
  ctx.strokeStyle = css([8, 8, 12], 0.85)
  for (let i = 0; i < rng.int(1, 4); i++) {
    const z = rng.range(8, 40)
    const y = rng.range(7, 11)
    const [x0, y0] = P(-FAC, y, z)
    const [x1, y1] = P(FAC, y + rng.range(-1, 1), z)
    ctx.lineWidth = Math.max(s.px, (cam.f * 0.04) / z)
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + (cam.f * 1.2) / z, x1, y1)
    ctx.stroke()
  }

  items.sort((a, b) => b.Z - a.Z)
  for (const it of items) it.draw()

  // ---- composite reflections masked by puddles
  const wet = 0.55 + env.rain * 0.45
  const rb = blurSurface(R, pw * 0.004)
  const mask = fieldSurface(Math.round(pw / 4), Math.round((pw / 4) * H), H, (u, v, o) => {
    if (v < cam.hy) { o[3] = 0; return }
    const d = (v - cam.hy) + 0.02
    const n = fbm(noise, (u * 0.6) / d * 0.12 + 40, (v * 14) / d * 0.12, 4) * 0.5 + 0.5
    o[0] = o[1] = o[2] = 1
    o[3] = clamp(0.35 + wet * 0.5 + (n - 0.5) * 1.6, 0.15, 1)
  })
  rb.ctx.globalCompositeOperation = 'destination-in'
  rb.ctx.drawImage(mask.canvas, 0, 0, rb.w, rb.h)
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalCompositeOperation = 'screen'
  ctx.drawImage(rb.canvas, 0, 0)
  ctx.globalAlpha = 0.35
  ctx.drawImage(R.canvas, 0, 0)
  ctx.restore()
  glow.save()
  glow.setTransform(1, 0, 0, 1, 0, 0)
  glow.globalCompositeOperation = 'screen'
  glow.globalAlpha = 0.5
  glow.drawImage(rb.canvas, 0, 0)
  glow.restore()

  // ---- night haze towards the vanishing point
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  const hz = ctx.createRadialGradient(cam.vx, cam.hy, 0, cam.vx, cam.hy, 0.6)
  hz.addColorStop(0, css([120, 70, 60], 0.5 + env.fog * 0.3))
  hz.addColorStop(0.3, css([70, 40, 50], 0.22 + env.fog * 0.2))
  hz.addColorStop(1, css([30, 20, 30], 0))
  ctx.fillStyle = hz
  ctx.fillRect(0, 0, 1, H)
  ctx.restore()
}

export const cinestill: FilmImpl = {
  meta: {
    id: 'cinestill',
    name: 'Синестилл 800',
    short: 'CINESTILL 800T',
    description: 'Ночь, неон, мокрый асфальт и красные ореолы огней',
    swatch: ['#0e1a2b', '#ff4d6d', '#ffb15c'],
  },
  paper: [239, 233, 223],
  devTone: [226, 206, 196],
  devMono: 0.75,
  draw,
  grade: (env) =>
    baseGrade({
      contrast: 0.28,
      lift: [0.035, 0.045, 0.07],
      gain: [1.02, 0.98, 0.96 - env.warmth * 0.03],
      gamma: [1.02, 1, 0.94],
      sat: 1.12,
      shadowTint: [-0.02, 0.02, 0.05],
      highlightTint: [0.04, 0.0, -0.03],
      grain: 0.085,
      grainChroma: 0.6,
      grainClump: 0.25,
      vignette: 0.45,
    }),
  bloom: () => [
    { radius: 0.006, strength: 0.6, tint: [255, 230, 210] },
    { radius: 0.018, strength: 1.9, tint: [255, 50, 26], mono: true },
    { radius: 0.07, strength: 0.8, tint: [255, 70, 40], mono: true },
  ],
  precipTone: [255, 220, 200],
}
