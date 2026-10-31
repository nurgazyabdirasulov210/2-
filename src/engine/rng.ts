// Deterministic PRNG utilities (no Math.random anywhere in the engine).

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a 32-bit string hash. */
export function hashString(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Combine two 32-bit values into a new well-mixed seed. */
export function mixSeed(a: number, b: number): number {
  let h = (a ^ Math.imul(b + 0x9e3779b9, 0x85ebca6b)) >>> 0
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d)
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b)
  return (h ^ (h >>> 16)) >>> 0
}

/** Fast integer hash of a 2D lattice point -> [0,1). Used for grain. */
export function hash2(x: number, y: number, s: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

export class Rng {
  readonly seed: number
  private next: () => number
  constructor(seed: number) {
    this.seed = seed >>> 0
    this.next = mulberry32(this.seed)
  }
  float(): number { return this.next() }
  range(a: number, b: number): number { return a + (b - a) * this.next() }
  int(a: number, b: number): number { return a + Math.floor(this.next() * (b - a + 1)) }
  chance(p: number): boolean { return this.next() < p }
  sign(): number { return this.next() < 0.5 ? -1 : 1 }
  pick<T>(arr: readonly T[]): T { return arr[Math.floor(this.next() * arr.length) % arr.length] }
  /** Approximately normal (Irwin–Hall, 4 samples), mean 0, sd ~1. */
  gauss(): number {
    return (this.next() + this.next() + this.next() + this.next() - 2) * 1.732
  }
  /** Independent stream that does not depend on how much of this one was consumed. */
  fork(tag: string | number): Rng {
    return new Rng(mixSeed(this.seed, typeof tag === 'number' ? tag : hashString(tag)))
  }
}
