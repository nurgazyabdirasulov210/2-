// Seeded 2D gradient (Perlin-style) noise + fractal helpers.
import { mulberry32 } from './rng'

export type Noise2D = (x: number, y: number) => number

const GX = new Float32Array(16)
const GY = new Float32Array(16)
for (let i = 0; i < 16; i++) {
  GX[i] = Math.cos((i / 16) * Math.PI * 2)
  GY[i] = Math.sin((i / 16) * Math.PI * 2)
}

export function createNoise2D(seed: number): Noise2D {
  const rnd = mulberry32(seed)
  const perm = new Uint8Array(256)
  for (let i = 0; i < 256; i++) perm[i] = i
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    const t = perm[i]; perm[i] = perm[j]; perm[j] = t
  }
  const p = new Uint8Array(512)
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255]

  return (x: number, y: number): number => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const xf = x - xi
    const yf = y - yi
    const X = xi & 255
    const Y = yi & 255
    const aa = p[p[X] + Y] & 15
    const ab = p[p[X] + Y + 1] & 15
    const ba = p[p[X + 1] + Y] & 15
    const bb = p[p[X + 1] + Y + 1] & 15
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10)
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10)
    const n00 = GX[aa] * xf + GY[aa] * yf
    const n10 = GX[ba] * (xf - 1) + GY[ba] * yf
    const n01 = GX[ab] * xf + GY[ab] * (yf - 1)
    const n11 = GX[bb] * (xf - 1) + GY[bb] * (yf - 1)
    const x1 = n00 + (n10 - n00) * u
    const x2 = n01 + (n11 - n01) * u
    return (x1 + (x2 - x1) * v) * 1.414
  }
}

/** Fractal Brownian motion, roughly in [-1, 1]. */
export function fbm(n: Noise2D, x: number, y: number, octaves = 5, lacunarity = 2, gain = 0.5): number {
  let sum = 0
  let amp = 1
  let norm = 0
  let f = 1
  for (let i = 0; i < octaves; i++) {
    sum += amp * n(x * f + i * 17.17, y * f - i * 9.31)
    norm += amp
    amp *= gain
    f *= lacunarity
  }
  return sum / norm
}

/** Ridged multifractal in [0, 1] — sharp crests, good for mountains & caustics. */
export function ridged(n: Noise2D, x: number, y: number, octaves = 5, lacunarity = 2.1, gain = 0.5): number {
  let sum = 0
  let amp = 0.5
  let f = 1
  let prev = 1
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    let v = 1 - Math.abs(n(x * f + i * 31.7, y * f + i * 7.1))
    v *= v
    sum += v * amp * prev
    norm += amp
    prev = v
    amp *= gain
    f *= lacunarity
  }
  return Math.min(1, sum / norm)
}
