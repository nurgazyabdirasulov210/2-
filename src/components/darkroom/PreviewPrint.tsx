import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Shuffle } from 'lucide-react'
import { FrameCanvas } from '../FrameCanvas'
import type { FilmId, FrameParams, Weather } from '../../types'
import { filmOf } from './util'

/** "Как может выглядеть": a small print of the chosen film at full development. */
export function PreviewPrint({
  film,
  seed,
  weather,
  nextNumber,
  onShuffle,
  compact = false,
}: {
  film: FilmId
  seed: number
  weather: Weather | null
  nextNumber: number
  onShuffle: () => void
  compact?: boolean
}) {
  const reduce = useReducedMotion()
  const f = filmOf(film)
  const [hour] = useState(() => new Date().getHours())
  const params = useMemo<FrameParams>(
    () => ({ seed, film, weather, hour, peeks: 0, fogged: false }),
    [seed, film, weather, hour],
  )

  return (
    <figure className="relative">
      <div className="relative mx-auto w-full">
        {/* soft glow of the selected film behind the print */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-10 rounded-full opacity-60 blur-3xl transition-[background] duration-700"
          style={{ background: `radial-gradient(closest-side, ${f.swatch[0]}55, ${f.swatch[1]}22 60%, transparent)` }}
        />
        <div className={'relative rounded-[4px] bg-paper p-[5%] shadow-lg ' + (compact ? 'rotate-[3deg] pb-[12%]' : 'rotate-[-1.2deg] pb-[16%]')}>
          <div className="relative overflow-hidden bg-paper-ink/10">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={`${film}-${seed}`}
                initial={reduce ? { opacity: 0 } : { opacity: 0, filter: 'blur(10px) brightness(1.6)' }}
                animate={{ opacity: 1, filter: 'blur(0px) brightness(1)' }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0.12 : 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <FrameCanvas params={params} progress={1} maxDpr={1.5} label={`Пример кадра на плёнке «${f.name}»`} />
              </motion.div>
            </AnimatePresence>
          </div>
          {!compact && (
          <figcaption className="absolute inset-x-[5%] bottom-0 flex h-[16%] items-center justify-between gap-2">
            <span className="truncate font-display text-[clamp(.95rem,2.4vw,1.15rem)] italic text-paper-ink/80">
              как может выглядеть
            </span>
            <span className="shrink-0 font-mono text-[10px] tracking-[0.14em] text-paper-ink/55 tabular">
              {f.short} · №{nextNumber}
            </span>
          </figcaption>
          )}
        </div>
      </div>
      {!compact && (
      <button
        type="button"
        onClick={onShuffle}
        className="glass absolute -right-2 -top-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-text-2 shadow-md transition-colors hover:text-text-1"
        aria-label="Другой пример"
        title="Другой пример"
      >
        <Shuffle className="h-4 w-4" aria-hidden />
      </button>
      )}
    </figure>
  )
}
