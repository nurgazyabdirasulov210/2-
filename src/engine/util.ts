export type RGB = [number, number, number]

export const clamp = (v: number, a = 0, b = 1): number => (v < a ? a : v > b ? b : v)
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
export const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
export const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
export const scale = (a: RGB, k: number): RGB => [a[0] * k, a[1] * k, a[2] * k]
export const css = (c: RGB, a = 1): string =>
  `rgba(${Math.round(clamp(c[0], 0, 255))},${Math.round(clamp(c[1], 0, 255))},${Math.round(clamp(c[2], 0, 255))},${clamp(a)})`
export const hex = (h: string): RGB => {
  const n = parseInt(h.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
