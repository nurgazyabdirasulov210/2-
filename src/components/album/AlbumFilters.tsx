import type { FilmId } from '../../types'
import { FILM_IDS, getFilm } from './films'

export type FogFilter = 'all' | 'clean' | 'fogged'

export function Swatch({ id, size = 10 }: { id: FilmId; size?: number }) {
  const s = getFilm(id).swatch
  return (
    <span aria-hidden className="inline-flex shrink-0">
      {s.map((c, i) => (
        <span
          key={i}
          className="rounded-full ring-[1.5px] ring-surface-1"
          style={{ width: size, height: size, background: c, marginLeft: i ? -size * 0.35 : 0 }}
        />
      ))}
    </span>
  )
}

/** Tiny grease-pencil loop used as an icon. */
export function CircleMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <path
        d="M14.8 4.6C12.4 2.6 7.3 2.7 4.6 5.6 2 8.4 2.6 13.3 5.6 15.6c3 2.3 8 1.8 10.2-1.4 2-2.9 1.4-7-1.6-9.2-1.3-.9-2.6-1.2-3.9-1.3"
        fill="none"
        stroke="#E0332A"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

const chip =
  'inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-body-sm transition-[background-color,border-color,color] duration-150 ease-out-quint cursor-pointer select-none active:scale-[0.97]'
const chipOn = 'border-text-1/70 bg-surface-3 text-text-1'
const chipOff = 'border-border text-text-2 hover:border-border-strong hover:text-text-1'

export function AlbumFilters({
  films,
  counts,
  onToggleFilm,
  onClearFilms,
  favOnly,
  onFavOnly,
  fog,
  onFog,
}: {
  films: Set<FilmId>
  counts: Partial<Record<FilmId, number>>
  onToggleFilm(id: FilmId): void
  onClearFilms(): void
  favOnly: boolean
  onFavOnly(v: boolean): void
  fog: FogFilter
  onFog(v: FogFilter): void
}) {
  const available = FILM_IDS.filter((id) => (counts[id] ?? 0) > 0)
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
      <div
        role="group"
        aria-label="Фильтр по плёнке"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
      >
        <button type="button" aria-pressed={films.size === 0} onClick={onClearFilms} className={`${chip} ${films.size === 0 ? chipOn : chipOff}`}>
          Все плёнки
        </button>
        {available.map((id) => {
          const on = films.has(id)
          return (
            <button key={id} type="button" aria-pressed={on} onClick={() => onToggleFilm(id)} className={`${chip} ${on ? chipOn : chipOff}`}>
              <Swatch id={id} />
              <span>{getFilm(id).name}</span>
              <span className="font-mono text-caption text-text-3 tabular">{counts[id]}</span>
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:flex-nowrap">
        <button type="button" aria-pressed={favOnly} onClick={() => onFavOnly(!favOnly)} className={`${chip} ${favOnly ? chipOn : chipOff}`}>
          <CircleMark className="size-4" />
          Только избранное
        </button>
        <div role="radiogroup" aria-label="Состояние кадра" className="inline-flex h-9 items-center rounded-full border border-border p-0.5">
          {(
            [
              ['all', 'Все'],
              ['clean', 'Чистые'],
              ['fogged', 'Засвеченные'],
            ] as [FogFilter, string][]
          ).map(([v, l]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={fog === v}
              onClick={() => onFog(v)}
              className={`h-8 cursor-pointer rounded-full px-3 text-body-sm transition-colors duration-150 ${fog === v ? 'bg-surface-3 text-text-1' : 'text-text-2 hover:text-text-1'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
