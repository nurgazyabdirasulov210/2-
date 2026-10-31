import { MotionConfig, motion } from 'framer-motion'
import { useMemo, useState, type ReactNode } from 'react'
import { CircleMark, Swatch } from '../components/album/AlbumFilters'
import { DemoBanner, EmptyInvite } from '../components/album/EmptyState'
import { getFilm } from '../components/album/films'
import { useAlbumFrames } from '../components/album/useAlbumFrames'
import { FilmBars } from '../components/stats/FilmBars'
import { Heatmap } from '../components/stats/Heatmap'
import { HEAT_LEVELS } from '../components/stats/heatLevels'
import { HourClock } from '../components/stats/HourClock'
import { poeticSummary } from '../components/stats/summary'
import { useCountUp } from '../components/stats/useCountUp'
import { getDemoFrames, useDemoPreview } from '../lib/demo'
import { dayKey, formatDate, formatDuration, pluralRu } from '../lib/format'
import { computeStats } from '../lib/stats'
import { useStudio } from '../store'

function Tile({
  className = '',
  label,
  children,
  i,
}: {
  className?: string
  label?: string
  children: ReactNode
  i?: number
}) {
  const idx = i ?? 0
  return (
    <motion.section
      aria-label={label}
      className={`card relative flex min-h-[140px] flex-col gap-3 overflow-hidden p-5 sm:p-6 ${className}`}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: Math.min(idx, 7) * 0.05 }}
    >
      {label && <p className="text-overline uppercase text-text-3">{label}</p>}
      {children}
    </motion.section>
  )
}

function Unit({ children }: { children: ReactNode }) {
  return <span className="ml-2 font-sans text-body text-text-2">{children}</span>
}

function HeroHours({ ms }: { ms: number }) {
  const hours = ms / 3600000
  const [ref, v] = useCountUp<HTMLSpanElement>(hours, 1600)
  const fmt = (x: number) => (hours >= 10 ? String(Math.round(x)) : (Math.round(x * 10) / 10).toFixed(1).replace('.', ','))
  const final = fmt(hours)
  const unit = final.includes(',') ? 'часа' : pluralRu(Number(final), ['час', 'часа', 'часов'])
  return (
    <p className="flex flex-wrap items-baseline gap-x-4" aria-label={`${final} ${unit} без экрана`}>
      <span
        ref={ref}
        aria-hidden
        className="font-display text-[clamp(5.5rem,3rem+10vw,11rem)] font-medium leading-[0.8] tracking-[-0.04em] text-text-1 tabular"
      >
        {fmt(v)}
      </span>
      <span aria-hidden className="font-display text-display-lg italic text-text-2">
        {unit}
      </span>
    </p>
  )
}

function Num({ value, children }: { value: number; children?: ReactNode }) {
  const [ref, v] = useCountUp<HTMLSpanElement>(value, 1000)
  return (
    <p className="flex items-baseline">
      <span ref={ref} className="font-display text-stat-xl font-medium text-text-1 tabular">
        {Math.round(v)}
      </span>
      {children}
    </p>
  )
}

export default function Stats() {
  const { frames, demo } = useAlbumFrames()
  const stats = useMemo(() => computeStats(frames), [frames])
  const sentence = useMemo(() => poeticSummary(frames), [frames])
  const [now] = useState(() => Date.now())

  const loadDemo = () => {
    useStudio.setState({ frames: getDemoFrames().map((f) => ({ ...f })) })
    useDemoPreview.getState().set(false)
  }

  const header = (
    <header className="flex flex-col gap-2">
      <p className="text-overline uppercase text-text-3">Статистика</p>
      <h1 className="font-display text-display-xl text-text-1">Журнал проявки</h1>
    </header>
  )

  if (!frames.length) {
    return (
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 pb-32 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        {header}
        <EmptyInvite
          overline="Журнал пока пуст"
          title="Здесь проявится ваше время"
          body="Часы без экрана, серии дней и любимые плёнки появятся после первого кадра."
          visual={<EmptyHeatmap />}
        />
      </div>
    )
  }

  const film = stats.favoriteFilm ? getFilm(stats.favoriteFilm) : null
  const cleanPct = stats.framesCount ? Math.round((stats.cleanCount / stats.framesCount) * 100) : 0
  const favorites = frames.filter((f) => f.favorite).length
  const first = frames.reduce((m, f) => Math.min(m, f.startedAt), Infinity)
  const longestFrame = frames.reduce((m, f) => Math.max(m, f.developedMs), 0)

  // last 14 days for streak dots
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now)
    d.setHours(12, 0, 0, 0)
    d.setDate(d.getDate() - (13 - i))
    return (stats.byDay[dayKey(d.getTime())] ?? 0) > 0
  })

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 pb-32 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          {header}
          <p className="font-mono text-mono-sm text-text-2 sm:pb-2">с {formatDate(first)}</p>
        </div>
        {demo && <DemoBanner onLoad={loadDemo} />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
          {/* HERO */}
          <Tile i={0} label="Всего без экрана" className="justify-between gap-8 sm:col-span-2 lg:col-span-8 lg:row-span-2 lg:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full opacity-70 blur-3xl"
              style={{ background: 'radial-gradient(circle, var(--safelight-glow), transparent 65%)' }}
            />
            <HeroHours ms={stats.totalOfflineMs} />
            <p className="max-w-[34ch] text-balance font-display text-[clamp(1.35rem,1rem+1.2vw,2rem)] italic leading-snug text-text-1">
              {sentence}
            </p>
          </Tile>

          <Tile i={1} label="Кадров на листе" className="lg:col-span-4">
            <Num value={stats.framesCount}>
              <Unit>{pluralRu(stats.framesCount, ['кадр', 'кадра', 'кадров'])}</Unit>
            </Num>
            <p className="mt-auto flex items-center gap-2 text-body-sm text-text-2">
              <CircleMark className="size-4" /> {favorites} {pluralRu(favorites, ['обведён', 'обведено', 'обведено'])} красным
            </p>
          </Tile>

          <Tile i={2} label="Серия дней" className="lg:col-span-4">
            <Num value={stats.currentStreakDays}>
              <Unit>{pluralRu(stats.currentStreakDays, ['день подряд', 'дня подряд', 'дней подряд'])}</Unit>
            </Num>
            <div className="mt-auto flex flex-col gap-2">
              <div className="flex gap-1" role="img" aria-label={`Последние 14 дней: активных ${last14.filter(Boolean).length}`}>
                {last14.map((on, i) => (
                  <span
                    key={i}
                    className="h-2 flex-1 rounded-full"
                    style={{ background: on ? 'var(--safelight)' : 'var(--surface-3)' }}
                  />
                ))}
              </div>
              <p className="text-caption text-text-2">
                Рекорд — {stats.longestStreakDays} {pluralRu(stats.longestStreakDays, ['день', 'дня', 'дней'])} · последние две недели
              </p>
            </div>
          </Tile>

          <Tile i={3} label="Чистые и засвеченные" className="sm:col-span-2 lg:col-span-5">
            <p className="flex items-baseline">
              <span className="font-display text-stat-xl font-medium text-text-1 tabular">{cleanPct}%</span>
              <Unit>кадров проявлены без подглядываний</Unit>
            </p>
            <div
              className="mt-auto flex h-3 w-full gap-[2px]"
              role="img"
              aria-label={`Чистых ${stats.cleanCount}, засвеченных ${stats.foggedCount}`}
            >
              {stats.cleanCount > 0 && (
                <motion.span
                  className="h-full rounded-l-full bg-data-4 last:rounded-r-full"
                  style={{ originX: 0 }}
                  initial={{ flexGrow: 0.0001 }}
                  whileInView={{ flexGrow: stats.cleanCount }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              )}
              {stats.foggedCount > 0 && (
                <motion.span
                  className="h-full rounded-r-full bg-data-1 first:rounded-l-full"
                  initial={{ flexGrow: 0.0001 }}
                  whileInView={{ flexGrow: stats.foggedCount }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              )}
            </div>
            <div className="flex justify-between text-caption text-text-2">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-data-4" aria-hidden /> Чистые · {stats.cleanCount}
              </span>
              <span className="flex items-center gap-1.5">
                Засвеченные · {stats.foggedCount} <span className="size-2 rounded-full bg-data-1" aria-hidden />
              </span>
            </div>
          </Tile>

          <Tile i={4} label="Средняя сессия" className="lg:col-span-3">
            <p className="font-display text-[clamp(2.25rem,1.6rem+2vw,3.25rem)] font-medium leading-none text-text-1 tabular">
              {formatDuration(stats.averageSession)}
            </p>
            <p className="mt-auto text-caption text-text-2">Самая долгая — {formatDuration(longestFrame)}</p>
          </Tile>

          <Tile i={5} label="Любимая плёнка" className="lg:col-span-4">
            {film && (
              <>
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1.5"
                  style={{ background: `linear-gradient(90deg, ${film.swatch.join(', ')})` }}
                />
                <p className="flex items-center gap-3">
                  <Swatch id={film.id} size={14} />
                  <span className="font-display text-h1 italic text-text-1">{film.name}</span>
                </p>
                <p className="mt-auto text-caption text-text-2">
                  <span className="font-mono uppercase tracking-[0.12em] text-text-3">{film.short}</span> ·{' '}
                  {stats.byFilm[film.id]} {pluralRu(stats.byFilm[film.id] ?? 0, ['кадр', 'кадра', 'кадров'])}
                </p>
              </>
            )}
          </Tile>

          <Tile i={6} label="Календарь" className="sm:col-span-2 lg:col-span-12">
            <Heatmap byDay={stats.byDay} />
          </Tile>

          <Tile i={7} label="Когда гаснет свет" className="sm:col-span-2 lg:col-span-5">
            <HourClock byHour={stats.byHour} />
          </Tile>

          <Tile i={8} label="Плёнки" className="sm:col-span-2 lg:col-span-7">
            <p className="max-w-[40ch] text-body-sm text-text-2">Сколько кадров проявлено на каждой плёнке.</p>
            <div className="my-auto">
              <FilmBars byFilm={stats.byFilm} />
            </div>
          </Tile>
        </div>
      </div>
    </MotionConfig>
  )
}

/** Dashed outline of a future heatmap — empty-state visual. */
function EmptyHeatmap() {
  return (
    <svg viewBox="0 0 26 7" className="w-full max-w-2xl" aria-hidden>
      {Array.from({ length: 26 * 7 }, (_, i) => {
        const c = Math.floor(i / 7)
        const r = i % 7
        const lit = i === 26 * 7 - 3
        return (
          <rect
            key={i}
            x={c + 0.12}
            y={r + 0.12}
            width={0.76}
            height={0.76}
            rx={0.18}
            fill={lit ? HEAT_LEVELS[3] : 'none'}
            stroke="var(--text-3)"
            strokeWidth={0.04}
            strokeDasharray="0.12 0.1"
            className={lit ? 'animate-breathe' : ''}
            opacity={lit ? 1 : 0.45}
          />
        )
      })}
    </svg>
  )
}
