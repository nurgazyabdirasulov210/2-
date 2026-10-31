import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, Moon, Snowflake, Sun, type LucideIcon } from 'lucide-react'
import { getCurrentWeather, weatherKind, type WeatherKind } from '../../lib/weather'
import type { Weather } from '../../types'
import { signedTemp } from './util'

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

/** Fetches current weather (only mounted when the setting is on) and reports it upward for the preview. */
export function WeatherChip({ onWeather }: { onWeather?: (w: Weather | null) => void }) {
  const [state, setState] = useState<'loading' | 'ok' | 'none'>('loading')
  const [weather, setWeather] = useState<Weather | null>(null)

  useEffect(() => {
    let alive = true
    getCurrentWeather().then((w) => {
      if (!alive) return
      setWeather(w)
      setState(w ? 'ok' : 'none')
      onWeather?.(w)
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const Icon = weather ? weatherIcon(weather) : Cloud
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-surface-1 px-3 text-caption text-text-2"
      role="status"
    >
      <Icon className={'h-3.5 w-3.5 ' + (state === 'loading' ? 'animate-pulse text-text-3' : 'text-accent')} aria-hidden />
      {state === 'loading' && <span>Смотрю в окно…</span>}
      {state === 'ok' && weather && (
        <span>
          {weather.label} <span className="font-mono tabular text-text-1">{signedTemp(weather.temperature)}</span>
          <span className="text-text-3"> · войдёт в кадр</span>
        </span>
      )}
      {state === 'none' && <span>Погода недоступна</span>}
    </motion.div>
  )
}
