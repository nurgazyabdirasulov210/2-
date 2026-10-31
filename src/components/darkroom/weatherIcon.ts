import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, Moon, Snowflake, Sun, type LucideIcon } from 'lucide-react'
import { weatherKind, type WeatherKind } from '../../lib/weather'
import type { Weather } from '../../types'

const ICONS: Record<WeatherKind, LucideIcon> = {
  clear: Sun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: Snowflake,
  storm: CloudLightning,
}

export function weatherIcon(w: Weather): LucideIcon {
  const kind = weatherKind(w.weatherCode)
  if (kind === 'clear' && !w.isDay) return Moon
  return ICONS[kind]
}
