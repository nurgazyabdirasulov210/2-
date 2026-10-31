import { MotionConfig, motion } from 'framer-motion'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AlbumFilters, type FogFilter } from '../components/album/AlbumFilters'
import { DemoBanner, EmptyInvite } from '../components/album/EmptyState'
import { FilmStrip } from '../components/album/FilmStrip'
import { monthName } from '../components/album/films'
import { useAlbumFrames } from '../components/album/useAlbumFrames'
import { Button } from '../components/ui/Button'
import { getDemoFrames, useDemoPreview } from '../lib/demo'
import { formatDuration, pluralRu } from '../lib/format'
import { useStudio } from '../store'
import type { FilmId, Frame } from '../types'

function useMedia(q: string): boolean {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setM(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [q])
  return m
}

function usePerStrip(): number {
  const lg = useMedia('(min-width: 1024px)')
  const sm = useMedia('(min-width: 640px)')
  return lg ? 6 : sm ? 4 : 3
}

interface MonthGroup {
  key: string
  year: number
  month: number
  frames: Frame[]
  ms: number
}

function groupByMonth(frames: Frame[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>()
  for (const f of [...frames].sort((a, b) => a.startedAt - b.startedAt)) {
    const d = new Date(f.startedAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    let g = map.get(key)
    if (!g) map.set(key, (g = { key, year: d.getFullYear(), month: d.getMonth(), frames: [], ms: 0 }))
    g.frames.push(f)
    g.ms += f.developedMs
  }
  return [...map.values()].reverse() // newest month first, frames within a month in shooting order
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

// Deterministic tiny tilt per strip so the sheet feels hand-laid.
const tiltFor = (seed: number) => (((seed % 1000) / 1000) - 0.5) * 0.5

export default function Album() {
  const { frames, demo } = useAlbumFrames()
  const perStrip = usePerStrip()
  const [films, setFilms] = useState<Set<FilmId>>(new Set())
  const [favOnly, setFavOnly] = useState(false)
  const [fog, setFog] = useState<FogFilter>('all')

  const counts = useMemo(() => {
    const c: Partial<Record<FilmId, number>> = {}
    for (const f of frames) c[f.film] = (c[f.film] ?? 0) + 1
    return c
  }, [frames])

  const filtered = useMemo(
    () =>
      frames.filter(
        (f) =>
          (films.size === 0 || films.has(f.film)) &&
          (!favOnly || f.favorite) &&
          (fog === 'all' || (fog === 'clean' ? !f.fogged : f.fogged)),
      ),
    [frames, films, favOnly, fog],
  )
  const groups = useMemo(() => groupByMonth(filtered), [filtered])
  const totalMs = useMemo(() => frames.reduce((s, f) => s + f.developedMs, 0), [frames])

  const loadDemo = () => {
    useStudio.setState({ frames: getDemoFrames().map((f) => ({ ...f })) })
    useDemoPreview.getState().set(false)
  }

  if (frames.length === 0) {
    return (
      <Page>
        <Header />
        <EmptyInvite
          overline="Контактный лист пуст"
          title="Плёнка ещё не отснята"
          body="Каждая сессия без экрана проявляет один кадр. Погасите свет — и здесь появится первая полоска плёнки."
        />
      </Page>
    )
  }

  const filteredOut = filtered.length === 0
  return (
    <MotionConfig reducedMotion="user">
      <Page>
        <Header
          meta={
            <>
              {frames.length} {pluralRu(frames.length, ['кадр', 'кадра', 'кадров'])}
              <span className="mx-2 text-text-3">·</span>
              {formatDuration(totalMs)} без экрана
            </>
          }
        />
        {demo && <DemoBanner onLoad={loadDemo} />}
        <AlbumFilters
          films={films}
          counts={counts}
          onToggleFilm={(id) =>
            setFilms((s) => {
              const n = new Set(s)
              if (n.has(id)) n.delete(id)
              else n.add(id)
              return n
            })
          }
          onClearFilms={() => setFilms(new Set())}
          favOnly={favOnly}
          onFavOnly={setFavOnly}
          fog={fog}
          onFog={setFog}
        />

        {filteredOut ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border-strong px-6 py-16 text-center">
            <p className="font-display text-h1 italic text-text-1">На этом листе пусто</p>
            <p className="text-body-sm text-text-2">Ни один кадр не подходит под фильтры.</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilms(new Set())
                setFavOnly(false)
                setFog('all')
              }}
            >
              Сбросить фильтры
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-14 sm:gap-16">
            {groups.map((g) => (
              <section key={g.key} aria-labelledby={`m-${g.key}`} className="flex flex-col gap-6">
                <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
                  <h2 id={`m-${g.key}`} className="flex items-baseline gap-3">
                    <span className="font-display text-display-lg italic leading-none text-text-1">{monthName(g.month)}</span>
                    <span className="font-mono text-mono-sm text-text-3 tabular">{g.year}</span>
                  </h2>
                  <p className="pb-1 text-right font-mono text-caption uppercase tracking-[0.1em] text-text-2 tabular">
                    {g.frames.length} {pluralRu(g.frames.length, ['кадр', 'кадра', 'кадров'])}
                    <span className="hidden sm:inline"> · {formatDuration(g.ms)}</span>
                  </p>
                </div>
                <div className="flex flex-col gap-5 sm:gap-6">
                  {chunk(g.frames, perStrip).map((strip, i) => (
                    <motion.div
                      key={`${g.key}-${perStrip}-${i}`}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: Math.min(i, 4) * 0.05 }}
                    >
                      <FilmStrip frames={strip} perStrip={perStrip} tilt={tiltFor(strip[0].seed)} demo={demo} />
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </Page>
    </MotionConfig>
  )
}

function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 pb-32 pt-8 sm:px-6 sm:pt-12 lg:px-8">{children}</div>
}

function Header({ meta }: { meta?: ReactNode }) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        <p className="text-overline uppercase text-text-3">Альбом</p>
        <h1 className="font-display text-display-xl text-text-1">Контактный лист</h1>
      </div>
      {meta && <p className="font-mono text-mono-sm text-text-2 tabular sm:pb-2">{meta}</p>}
    </header>
  )
}
