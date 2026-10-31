import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { DoorClosed } from 'lucide-react'
import { useStudio } from '../../store'
import { useSessionClock } from '../../lib/visibility'
import { pluralRu } from '../../lib/format'
import type { FrameParams } from '../../types'
import { Safelight } from './Safelight'
import { DeveloperTray } from './DeveloperTray'
import { LeakMarkers } from './LeakMarkers'

const WARM = '#ffe2c2'
const WARM_DIM = 'rgba(255, 220, 185, .62)'

/** Phase 3 — the user came back early: the door is open and warm light spills onto the paper. */
export function DoorOpen({ onTakeAsIs }: { onTakeAsIs: () => void }) {
  const reduce = useReducedMotion()
  const closeDoor = useStudio((s) => s.closeDoor)
  const graceSeconds = useStudio((s) => s.settings.graceSeconds)
  const { session, progress, doorOpenMs, graceLeftMs, autoCloseInMs } = useSessionClock()

  const params = useMemo<FrameParams | null>(
    () =>
      session
        ? { seed: session.seed, film: session.film, weather: session.weather, hour: session.hour, peeks: session.peeks, fogged: false }
        : null,
    [session],
  )
  if (!session || !params) return null

  const grace = Math.max(1, graceSeconds) * 1000
  const exposure = Math.min(1, doorOpenMs / grace)
  const light = 0.18 + exposure * 0.55
  const graceLeft = Math.ceil(graceLeftMs / 1000)
  const autoClose = Math.ceil(autoCloseInMs / 1000)
  const leaks = session.peeks

  const ease = [0.22, 1, 0.36, 1] as const

  return (
    <motion.div
      className="dr-room dr-door fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: reduce ? 0.1 : 0.45 } }}
      transition={{ duration: reduce ? 0.12 : 0.3 }}
      role="alertdialog"
      aria-labelledby="door-title"
      aria-describedby="door-desc"
    >
      <Safelight intensity={0.45} />

      {/* the door: a warm slab of light opening from the right edge */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <motion.div
          className="dr-spill absolute inset-y-0 right-0 origin-right"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: reduce ? 0.12 : 1.4, ease }}
          style={{
            width: 'min(70vw, 820px)',
            background:
              'linear-gradient(270deg, rgba(255,226,180,.95) 0%, rgba(255,196,130,.55) 6%, rgba(255,170,100,.22) 30%, rgba(255,150,80,.06) 65%, transparent 100%)',
          }}
        />
        {/* beam across the floor */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduce ? 0.12 : 2, delay: reduce ? 0 : 0.3, ease }}
          style={{
            background: 'linear-gradient(250deg, rgba(255,214,160,.30), rgba(255,190,120,.08) 55%, transparent 80%)',
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 18% 88%, 62% 30%)',
            maskImage: 'linear-gradient(250deg, #000 20%, transparent 85%)',
            WebkitMaskImage: 'linear-gradient(250deg, #000 20%, transparent 85%)',
            filter: 'blur(14px)',
          }}
        />
        {/* door edge (bright line) */}
        <motion.div
          className="absolute inset-y-0 right-0 w-[3px] bg-[#fff3df] shadow-[0_0_40px_12px_rgba(255,214,160,.6)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ duration: 0.4 }}
        />
        {/* dust in the beam */}
        {!reduce &&
          [12, 22, 31, 44, 57, 66, 78, 86].map((y, i) => (
            <span
              key={i}
              className="dr-dust"
              style={{ right: `${6 + ((i * 13) % 34)}%`, top: `${y}%`, animationDelay: `${i * 0.9}s`, animationDuration: `${6 + (i % 3) * 2}s` }}
            />
          ))}
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[1100px] flex-col items-center justify-center gap-8 px-5 py-[calc(28px+env(safe-area-inset-top))] md:flex-row md:gap-16 md:px-10">
        <motion.div
          className="w-[min(52vw,240px)] shrink-0 md:w-[min(34vw,380px)]"
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease }}
        >
          <DeveloperTray params={params} progress={progress} light={light} />
          <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: WARM_DIM }}>
            проявка на паузе · {Math.floor(progress * 100)}%
          </p>
        </motion.div>

        <div className="w-full max-w-[460px] text-center md:text-left">
          <motion.p
            className="text-overline uppercase"
            style={{ color: WARM_DIM }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduce ? 0 : 0.2 }}
          >
            Дверь открыта
          </motion.p>
          <motion.h1
            id="door-title"
            className="mt-3 font-display text-display-lg font-medium"
            style={{ color: WARM, textShadow: '0 0 40px rgba(255,190,120,.25)' }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, delay: reduce ? 0 : 0.25, ease }}
          >
            Свет падает на&nbsp;бумагу.
          </motion.h1>
          <motion.p
            id="door-desc"
            className="mt-2 font-display text-[1.6rem] italic leading-snug"
            style={{ color: WARM_DIM }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: reduce ? 0 : 0.45 }}
          >
            Вернись к жизни — кадр подождёт.
          </motion.p>

          <div className="mt-6 flex flex-col gap-2 text-body-sm md:items-start" style={{ color: WARM_DIM }}>
            <p aria-live="polite">
              {graceLeft > 0 ? (
                <>
                  Свет оставит след через{' '}
                  <span className="font-mono tabular" style={{ color: WARM }}>
                    {graceLeft}
                  </span>{' '}
                  с
                </>
              ) : (
                'Свет уже коснулся бумаги — на кадре будет засвет.'
              )}
            </p>
            {autoClose > 0 && (
              <p className="text-caption opacity-80">
                Отложи телефон — дверь закроется сама через <span className="font-mono tabular">{autoClose}</span> с
              </p>
            )}
            {leaks > 0 && (
              <p className="mt-1 inline-flex items-center justify-center gap-2 md:justify-start">
                <LeakMarkers count={leaks} />
                <span className="text-caption">
                  {leaks} {pluralRu(leaks, ['засвет', 'засвета', 'засветов'])} уже на плёнке
                </span>
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row md:justify-start">
            <button
              type="button"
              onClick={closeDoor}
              autoFocus
              className="inline-flex h-14 items-center justify-center gap-2.5 rounded-full px-7 text-body-lg font-medium text-[#1b120a] shadow-[0_14px_40px_-10px_rgba(255,190,120,.6)] transition-[filter,transform] duration-200 hover:brightness-105 active:scale-[0.97]"
              style={{ background: 'linear-gradient(180deg,#fff0dc,#ffd3a1)' }}
            >
              <DoorClosed className="h-5 w-5" aria-hidden />
              Закрыть дверь
            </button>
            <button
              type="button"
              onClick={onTakeAsIs}
              className="inline-flex h-14 items-center justify-center rounded-full border px-6 text-body transition-colors hover:bg-white/5 active:scale-[0.97]"
              style={{ color: WARM, borderColor: 'rgba(255,220,185,.28)' }}
            >
              Забрать как есть
            </button>
          </div>
          <p className="mt-3 text-caption" style={{ color: 'rgba(255,220,185,.45)' }}>
            «Забрать как есть» — кадр сохранится засвеченным, на {Math.floor(progress * 100)}% проявки.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
