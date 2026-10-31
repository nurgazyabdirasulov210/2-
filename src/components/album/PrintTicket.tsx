import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Moon, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatDate, formatDuration, formatTime, pluralRu } from '../../lib/format'
import { weatherKind } from '../../lib/weather'
import type { Frame, Weather } from '../../types'
import { Swatch } from './AlbumFilters'
import { getFilm } from './films'

const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']

export function WeatherIcon({ w, className = 'size-4' }: { w: Weather; className?: string }) {
  const k = weatherKind(w.weatherCode)
  const p = { className, 'aria-hidden': true, strokeWidth: 1.75 }
  switch (k) {
    case 'clear':
      return w.isDay ? <Sun {...p} /> : <Moon {...p} />
    case 'cloudy':
      return w.weatherCode === 3 ? <Cloud {...p} /> : w.isDay ? <CloudSun {...p} /> : <CloudMoon {...p} />
    case 'fog':
      return <CloudFog {...p} />
    case 'drizzle':
      return <CloudDrizzle {...p} />
    case 'rain':
      return <CloudRain {...p} />
    case 'snow':
      return <CloudSnow {...p} />
    case 'storm':
      return <CloudLightning {...p} />
  }
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-baseline gap-1 border-b border-dashed border-border py-2.5 last:border-b-0 sm:grid-cols-[8.5rem_1fr] sm:gap-3">
      <dt className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-3">{label}</dt>
      <dd className="min-w-0 text-body-sm text-text-1">{children}</dd>
    </div>
  )
}

/** Faux barcode derived from the frame seed. */
function Barcode({ seed }: { seed: number }) {
  const bars: { x: number; w: number }[] = []
  let x = 0
  let s = seed >>> 0 || 1
  for (let i = 0; i < 44; i++) {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0
    const w = 1 + (s % 3)
    if (i % 2 === 0) bars.push({ x, w })
    x += w + (i % 2 === 0 ? 0 : 1)
  }
  return (
    <svg viewBox={`0 0 ${x} 24`} preserveAspectRatio="none" className="h-7 w-40 text-text-2" aria-hidden>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={24} fill="currentColor" />
      ))}
    </svg>
  )
}

/** Notched perforation line across the ticket. */
function Tear() {
  return (
    <div aria-hidden className="relative my-1 h-4">
      <div className="absolute -left-[9px] top-0 size-4 rounded-full border border-border bg-bg" />
      <div className="absolute -right-[9px] top-0 size-4 rounded-full border border-border bg-bg" />
      <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-border-strong" />
    </div>
  )
}

export function PrintTicket({ frame, total }: { frame: Frame; total: number }) {
  const film = getFilm(frame.film)
  const d = new Date(frame.startedAt)
  const ratio = frame.durationMs > 0 ? Math.min(1, frame.developedMs / frame.durationMs) : 1
  return (
    <section aria-label="Квитанция фотолаборатории" className="card relative overflow-visible px-5 pb-5 pt-5 sm:px-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-3">Фотолаборатория «Проявка»</p>
          <p className="mt-1 font-display text-h2 italic text-text-1">Квитанция на отпечаток</p>
        </div>
        <p className="shrink-0 rounded-xs border border-border-strong px-2 py-1 font-mono text-mono-sm text-text-1 tabular">
          № {String(frame.number).padStart(4, '0')}
        </p>
      </header>
      <Tear />
      <dl>
        <Row label="Плёнка">
          <span className="flex items-center gap-2">
            <Swatch id={frame.film} />
            {film.name}
            <span className="truncate font-mono text-caption text-text-3">{film.short}</span>
          </span>
        </Row>
        <Row label="Дата">
          {formatDate(frame.startedAt)} <span className="text-text-2">· {WEEKDAYS[d.getDay()]}</span>
        </Row>
        <Row label="Время">
          <span className="font-mono tabular">
            {formatTime(frame.startedAt)} — {formatTime(frame.finishedAt)}
          </span>
        </Row>
        <Row label="Экспозиция">
          <div className="flex flex-col gap-1.5">
            <span className="tabular">
              {formatDuration(frame.developedMs)} <span className="text-text-3">из {formatDuration(frame.durationMs)}</span>
            </span>
            <span
              className="relative block h-1 w-full max-w-56 overflow-hidden rounded-full bg-surface-3"
              role="img"
              aria-label={`Проявлено ${Math.round(ratio * 100)}% от плана`}
            >
              <span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${ratio * 100}%`, background: frame.fogged ? 'var(--data-1)' : 'var(--data-4)' }}
              />
            </span>
          </div>
        </Row>
        <Row label="Подглядывания">
          {frame.peeks === 0 ? (
            <span className="text-text-2">ни разу — дверь была закрыта</span>
          ) : (
            <span className="flex items-center gap-2 tabular">
              {frame.peeks} {pluralRu(frame.peeks, ['раз', 'раза', 'раз'])}
              <span aria-hidden className="flex gap-1">
                {Array.from({ length: Math.min(frame.peeks, 8) }, (_, i) => (
                  <span key={i} className="size-1.5 rounded-full bg-safelight" />
                ))}
              </span>
            </span>
          )}
        </Row>
        <Row label="Погода">
          {frame.weather ? (
            <span className="flex flex-wrap items-center gap-x-2">
              <WeatherIcon w={frame.weather} className="size-4 shrink-0 text-text-2" />
              {frame.weather.label}
              <span className="font-mono text-text-2 tabular">
                {frame.weather.temperature > 0 ? '+' : ''}
                {Math.round(frame.weather.temperature)}°
              </span>
            </span>
          ) : (
            <span className="text-text-3">не записана</span>
          )}
        </Row>
        <Row label="Намерение">
          {frame.intention ? (
            <span className="font-display text-h3 italic leading-snug">«{frame.intention}»</span>
          ) : (
            <span className="text-text-3">без подписи</span>
          )}
        </Row>
        <Row label="Состояние">
          {frame.fogged ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-[color-mix(in_oklch,var(--data-1)_14%,transparent)] px-2.5 py-0.5 text-caption text-text-1">
              <span className="size-1.5 rounded-full bg-data-1" aria-hidden /> Засвечен — дверь открыли раньше
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-[color-mix(in_oklch,var(--data-4)_14%,transparent)] px-2.5 py-0.5 text-caption text-text-1">
              <span className="size-1.5 rounded-full bg-data-4" aria-hidden /> Чистый отпечаток
            </span>
          )}
        </Row>
      </dl>
      <Tear />
      <footer className="flex items-end justify-between gap-4 pt-1">
        <Barcode seed={frame.seed} />
        <p className="text-right font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-text-3">
          кадр {frame.number} из {total}
          <br />
          seed {frame.seed.toString(16).padStart(8, '0')}
        </p>
      </footer>
    </section>
  )
}
