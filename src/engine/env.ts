// Derives lighting/atmosphere parameters from hour + optional weather.
import type { FrameParams } from '../types'
import { clamp } from './util'

export interface Env {
  hour: number
  night: boolean
  /** -1..1, rough sine of the sun height (0 at ~6:00 and ~20:00). */
  sunElev: number
  /** 0..1 golden-hour strength. */
  golden: number
  /** 0..1 twilight / blue-hour strength. */
  dusk: number
  /** -1 (freezing) .. 1 (hot); 0 when unknown. */
  warmth: number
  /** 0..1 cloud cover, or NaN when unknown (film decides). */
  clouds: number
  rain: number
  snow: number
  fog: number
  storm: boolean
  /** 0..1 */
  wind: number
  hasWeather: boolean
}

const g = (x: number, mu: number, s: number) => Math.exp(-((x - mu) * (x - mu)) / (2 * s * s))

export function deriveEnv(p: FrameParams): Env {
  const hour = ((p.hour % 24) + 24) % 24
  const w = p.weather ?? null
  const night = w ? !w.isDay : hour < 6 || hour >= 21
  const sunElev = Math.sin((Math.PI * (hour - 6)) / 14)
  const golden = night ? 0 : clamp(g(hour, 7.4, 0.9) + g(hour, 19, 1.0))
  const dusk = clamp(g(hour, 5.5, 0.7) + g(hour, 20.7, 0.8))
  let rain = 0
  let snow = 0
  let fog = 0
  let storm = false
  if (w) {
    const c = w.weatherCode
    const pr = Math.max(0, w.precipitation || 0)
    if ((c >= 51 && c <= 57)) rain = clamp(0.3 + pr / 6, 0.3, 0.6)
    if ((c >= 61 && c <= 67) || (c >= 80 && c <= 82)) rain = clamp(0.5 + pr / 5, 0.5, 1)
    if (c >= 95) { rain = clamp(0.75 + pr / 8, 0.75, 1); storm = true }
    if ((c >= 71 && c <= 77) || c === 85 || c === 86) snow = clamp(0.45 + pr / 4, 0.45, 1)
    if (c === 45 || c === 48) fog = 0.85
  }
  return {
    hour,
    night,
    sunElev,
    golden,
    dusk,
    warmth: w ? clamp((w.temperature - 12) / 22, -1, 1) : 0,
    clouds: w ? clamp(w.cloudCover / 100) : NaN,
    rain,
    snow,
    fog,
    storm,
    wind: w ? clamp(w.windSpeed / 40) : 0.2,
    hasWeather: !!w,
  }
}

/** Cloudiness with a seeded fallback when weather is unknown. */
export function cloudiness(env: Env, fallback: number): number {
  const base = Number.isNaN(env.clouds) ? fallback : env.clouds
  return clamp(Math.max(base, env.rain * 0.85, env.snow * 0.8, env.fog * 0.7))
}
