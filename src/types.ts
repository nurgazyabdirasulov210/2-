// Shared domain types — the contract between all modules. Do not change without coordination.

export type FilmId = 'portra' | 'ilford' | 'cyan' | 'cinestill' | 'polaroid' | 'aurora'

export interface Film {
  id: FilmId
  name: string        // «Портра 400»
  short: string       // «PORTRA 400» — printed on film edge
  description: string // one-line mood description (RU)
  swatch: [string, string, string] // 3 hex colors for UI chips
}

export interface Weather {
  temperature: number    // °C
  weatherCode: number    // WMO code from Open-Meteo
  cloudCover: number     // 0..100
  precipitation: number  // mm
  isDay: boolean
  windSpeed: number      // km/h
  label: string          // human RU label, e.g. «Лёгкий дождь»
}

/** Everything the generator needs. Same params => identical image. */
export interface FrameParams {
  seed: number
  film: FilmId
  weather?: Weather | null
  hour: number          // local hour 0..23 at session start (affects light)
  peeks: number         // number of times user peeked — drives light leaks
  fogged: boolean       // session aborted early => heavy fog
}

export type SessionPhase = 'idle' | 'developing' | 'door-open' | 'done'

export interface ActiveSession {
  id: string
  film: FilmId
  intention: string
  durationMs: number
  startedAt: number     // epoch ms
  /** Accumulated ms of "developing" time (only counted while away/not peeking). */
  developedMs: number
  /** epoch ms when the current developing stretch started, null if paused (door open) */
  stretchStartedAt: number | null
  peeks: number
  doorOpenedAt: number | null
  seed: number
  weather: Weather | null
  hour: number
}

export interface Frame {
  id: string
  number: number        // sequential frame number in album (1-based)
  film: FilmId
  intention: string
  seed: number
  weather: Weather | null
  hour: number
  peeks: number
  fogged: boolean
  durationMs: number    // planned duration
  developedMs: number   // actual developed time
  startedAt: number
  finishedAt: number
  favorite: boolean
}

export interface Settings {
  sound: boolean
  weather: boolean            // use geolocation+weather
  notifications: boolean
  graceSeconds: number        // seconds before light leaks when door open (default 5)
  name: string
}
