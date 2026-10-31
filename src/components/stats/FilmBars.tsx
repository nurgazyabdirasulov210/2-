import { motion, useReducedMotion } from 'framer-motion'
import { pluralRu } from '../../lib/format'
import type { FilmId } from '../../types'
import { Swatch } from '../album/AlbumFilters'
import { FILM_IDS, getFilm } from '../album/films'

/** Horizontal bars: frames per film. Color follows the film (its swatch), text stays in text tokens. */
export function FilmBars({ byFilm }: { byFilm: Partial<Record<FilmId, number>> }) {
  const reduced = useReducedMotion()
  const rows = FILM_IDS.map((id) => ({ id, n: byFilm[id] ?? 0 })).sort((a, b) => b.n - a.n)
  const total = rows.reduce((s, r) => s + r.n, 0)
  const max = Math.max(1, ...rows.map((r) => r.n))
  return (
    <ul className="flex flex-col gap-3.5" aria-label="Использование плёнок">
      {rows.map((r, i) => {
        const f = getFilm(r.id)
        const pct = total ? Math.round((r.n / total) * 100) : 0
        return (
          <li key={r.id} className="grid grid-cols-[minmax(7.5rem,10rem)_1fr_auto] items-center gap-3 max-sm:grid-cols-[1fr_auto]">
            <span className="flex min-w-0 items-center gap-2 text-body-sm text-text-1">
              <Swatch id={r.id} size={9} />
              <span className="truncate">{f.name}</span>
            </span>
            <span className="relative h-2 rounded-full bg-surface-2 max-sm:order-3 max-sm:col-span-2">
              {r.n > 0 && (
                <motion.span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${(r.n / max) * 100}%`, background: `linear-gradient(90deg, ${f.swatch[0]}, ${f.swatch[1]})`, originX: 0 }}
                  initial={reduced ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20, delay: reduced ? 0 : i * 0.06 }}
                >
                  <span className="sr-only">{pct}%</span>
                </motion.span>
              )}
            </span>
            <span className="text-right font-mono text-caption text-text-2 tabular">
              {r.n} <span className="text-text-3">{pluralRu(r.n, ['кадр', 'кадра', 'кадров'])} · {pct}%</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
