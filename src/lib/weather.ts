// Open-Meteo client (no API key). Never throws.
import type { Weather } from '../types'

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const CACHE_KEY = 'proyavka:weather'
const CACHE_TTL_MS = 20 * 60 * 1000
const FETCH_TIMEOUT_MS = 4000
const GEO_TIMEOUT_MS = 8000

/** Full WMO weather interpretation code table → RU label. */
export const WMO_LABELS: Record<number, string> = {
  0: 'Ясно',
  1: 'Преимущественно ясно',
  2: 'Переменная облачность',
  3: 'Пасмурно',
  45: 'Туман',
  48: 'Изморозь и туман',
  51: 'Лёгкая морось',
  53: 'Морось',
  55: 'Сильная морось',
  56: 'Ледяная морось',
  57: 'Сильная ледяная морось',
  61: 'Лёгкий дождь',
  63: 'Дождь',
  65: 'Ливень',
  66: 'Ледяной дождь',
  67: 'Сильный ледяной дождь',
  71: 'Лёгкий снег',
  73: 'Снег',
  75: 'Снегопад',
  77: 'Снежная крупа',
  80: 'Небольшой ливень',
  81: 'Ливневый дождь',
  82: 'Сильный ливень',
  85: 'Снежный заряд',
  86: 'Сильный снежный заряд',
  95: 'Гроза',
  96: 'Гроза с градом',
  99: 'Сильная гроза с градом',
}

export function weatherLabel(code: number): string {
  return WMO_LABELS[code] ?? 'Неизвестная погода'
}

/** Coarse category handy for visuals. */
export type WeatherKind = 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm'
export function weatherKind(code: number): WeatherKind {
  if (code <= 1) return 'clear'
  if (code <= 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'storm'
  return 'cloudy'
}

interface CacheEntry { ts: number; weather: Weather }

function readCache(): Weather | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const e = JSON.parse(raw) as CacheEntry
    if (!e || typeof e.ts !== 'number' || Date.now() - e.ts > CACHE_TTL_MS) return null
    return e.weather
  } catch {
    return null
  }
}

function writeCache(weather: Weather): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), weather } satisfies CacheEntry))
  } catch {
    /* ignore */
  }
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

/** Fetch current weather for coordinates. Resolves null on any failure. */
export async function fetchWeather(latitude: number, longitude: number): Promise<Weather | null> {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = setTimeout(() => ctrl?.abort(), FETCH_TIMEOUT_MS)
  try {
    const url =
      `${ENDPOINT}?latitude=${latitude.toFixed(3)}&longitude=${longitude.toFixed(3)}` +
      '&current=temperature_2m,weather_code,cloud_cover,precipitation,is_day,wind_speed_10m'
    const res = await Promise.race([
      fetch(url, { signal: ctrl?.signal }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), FETCH_TIMEOUT_MS + 50)),
    ])
    if (!res.ok) return null
    const data = (await res.json()) as { current?: Record<string, unknown> }
    const c = data?.current
    if (!c) return null
    const code = Math.round(num(c.weather_code))
    return {
      temperature: num(c.temperature_2m),
      weatherCode: code,
      cloudCover: Math.min(100, Math.max(0, num(c.cloud_cover))),
      precipitation: Math.max(0, num(c.precipitation)),
      isDay: num(c.is_day, 1) === 1,
      windSpeed: Math.max(0, num(c.wind_speed_10m)),
      label: weatherLabel(code),
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function getPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    try {
      if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null)
      let done = false
      const finish = (p: GeolocationPosition | null) => {
        if (!done) {
          done = true
          resolve(p)
        }
      }
      // Safety net: some browsers never call back if the prompt is ignored.
      setTimeout(() => finish(null), GEO_TIMEOUT_MS + 500)
      navigator.geolocation.getCurrentPosition(finish, () => finish(null), {
        enableHighAccuracy: false,
        timeout: GEO_TIMEOUT_MS,
        maximumAge: 30 * 60 * 1000,
      })
    } catch {
      resolve(null)
    }
  })
}

/**
 * Current weather at the user's location (asks for geolocation permission if needed).
 * Cached for 20 minutes in sessionStorage. Never throws; null when unavailable/denied.
 */
export async function getCurrentWeather(): Promise<Weather | null> {
  try {
    const cached = readCache()
    if (cached) return cached
    const pos = await getPosition()
    if (!pos) return null
    const w = await fetchWeather(pos.coords.latitude, pos.coords.longitude)
    if (w) writeCache(w)
    return w
  } catch {
    return null
  }
}

/** Current geolocation permission state, or 'unknown' if the Permissions API is unavailable. */
export async function geolocationPermission(): Promise<PermissionState | 'unknown'> {
  try {
    if (!navigator.permissions?.query) return 'unknown'
    const s = await navigator.permissions.query({ name: 'geolocation' })
    return s.state
  } catch {
    return 'unknown'
  }
}
