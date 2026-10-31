import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useSessionClock } from '../../lib/visibility'
import { formatClock, pluralRu } from '../../lib/format'
import type { FrameParams } from '../../types'
import { Safelight } from './Safelight'
import { DeveloperTray } from './DeveloperTray'
import { ProgressArc } from './ProgressArc'
import { LeakMarkers } from './LeakMarkers'
import { filmOf, useIdle, SAFE_INK, SAFE_INK_DIM } from './util'

const MILESTONES = ['', 'Проявлена четверть кадра', 'Кадр проявлен наполовину', 'Проявлено три четверти кадра', 'Кадр почти готов']

/** Phase 2 — lights off, the print is developing in the tray under the safelight. */
export function DevelopingRoom({ onRequestAbort, frameNumber }: { onRequestAbort: () => void; frameNumber: number }) {
  const reduce = useReducedMotion()
  const { session, progress, remainingMs } = useSessionClock()
  const idle = useIdle(8000)

  const params = useMemo<FrameParams | null>(
    () =>
      session
        ? { seed: session.seed, film: session.film, weather: session.weather, hour: session.hour, peeks: session.peeks, fogged: false }
        : null,
    [session],
  )

  // aria-live milestones (quarters), not every tick
  const quarter = Math.min(4, Math.floor(progress * 4 + 1e-6))
  const firstQuarter = useRef(quarter)
  const [announce, setAnnounce] = useState('')
  useEffect(() => {
    if (quarter !== firstQuarter.current && quarter > 0) setAnnounce(MILESTONES[quarter] ?? '')
  }, [quarter])

  // Quantize progress for the canvas so we don't redraw the generator 4×/s for invisible changes.
  const canvasProgress = Math.round(progress * 400) / 400

  if (!session || !params) return null
  const film = filmOf(session.film)
  const chrome = idle ? 0.16 : 1
  const minutesLeft = Math.ceil(remainingMs / 60000)

  return (
    <motion.div
      className="dr-room fixed inset-0 z-[60] flex flex-col overflow-hidden text-[#ff8a7a]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: reduce ? 0.1 : 0.5 } }}
      transition={{ duration: reduce ? 0.12 : 0.8 }}
      role="region"
      aria-label="Тёмная комната: идёт проявка"
    >
      <Safelight intensity={idle ? 0.5 : 1} />

      {/* top bar */}
      <motion.div
        className="relative z-10 flex items-center justify-between gap-3 px-4 pt-[calc(14px+env(safe-area-inset-top))] sm:px-8 sm:pt-6"
        animate={{ opacity: chrome }}
        transition={{ duration: idle ? 2.4 : 0.3 }}
      >
        <p className="min-w-0 truncate font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: SAFE_INK_DIM }}>
          {film.short} <span aria-hidden>·</span> кадр №{frameNumber}
        </p>
        <div className="flex items-center gap-3">
          {session.peeks > 0 && <LeakMarkers count={session.peeks} tone="red" />}
          <button
            type="button"
            onClick={onRequestAbort}
            className="h-9 rounded-full border border-[rgba(255,110,95,.25)] px-3.5 text-body-sm transition-colors hover:border-[rgba(255,110,95,.5)] hover:bg-[rgba(255,80,60,.08)]"
            style={{ color: SAFE_INK }}
          >
            Прервать
          </button>
        </div>
      </motion.div>

      {/* tray */}
      <div className="relative z-0 flex min-h-0 flex-1 items-center justify-center px-4">
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.96, filter: 'brightness(0)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: idle ? 'brightness(0.78)' : 'brightness(1)' }}
          transition={{ duration: reduce ? 0.12 : idle ? 3 : 1.6, delay: reduce || idle ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-[min(74vw,calc((100dvh-340px)*0.83),420px)] min-w-[200px]"
        >
          <DeveloperTray params={params} progress={canvasProgress} />
        </motion.div>
      </div>

      {/* readout */}
      <motion.div
        className="relative z-10 flex flex-col items-center px-6 pb-[calc(20px+env(safe-area-inset-bottom))] text-center sm:pb-10"
        animate={{ opacity: idle ? 0.32 : 1 }}
        transition={{ duration: idle ? 2.4 : 0.3 }}
      >
        <div className="relative w-[210px]">
          <ProgressArc progress={progress} className="block w-full" />
          <div className="absolute inset-x-0 bottom-[6px] flex flex-col items-center">
            <span className="text-overline uppercase" style={{ color: SAFE_INK_DIM }}>
              осталось
            </span>
            <span
              className="tabular font-mono text-[2.6rem] font-medium leading-none tracking-[-0.02em]"
              style={{ color: '#ff7a68', textShadow: '0 0 24px rgba(255,80,60,.45)' }}
              aria-label={`Осталось ${minutesLeft} ${pluralRu(minutesLeft, ['минута', 'минуты', 'минут'])}`}
            >
              {formatClock(remainingMs)}
            </span>
          </div>
        </div>
        <p className="mt-2 font-mono text-[11px] tabular tracking-[0.14em]" style={{ color: SAFE_INK_DIM }}>
          {Math.floor(progress * 100)}% ПРОЯВЛЕНО
        </p>
        {session.intention && (
          <p className="mt-3 max-w-[30ch] truncate font-display text-[1.2rem] italic" style={{ color: SAFE_INK }}>
            «{session.intention}»
          </p>
        )}
        <motion.p
          className="mt-3 max-w-[40ch] text-body-sm leading-relaxed"
          style={{ color: SAFE_INK_DIM }}
          animate={{ opacity: idle ? 0.4 : 1 }}
        >
          Уйди с этой вкладки или просто отложи телефон. Кадр проявляется, пока ты не смотришь.
        </motion.p>
      </motion.div>

      <p className="sr-only" aria-live="polite" role="status">
        {announce}
      </p>
    </motion.div>
  )
}
