import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { formatTime, pluralRu } from '../../lib/format'

export const PRESETS = [10, 25, 45, 90] as const
const MIN = 5
const MAX = 180

const presetHint: Record<number, string> = {
  10: 'вдох',
  25: 'помидор',
  45: 'прогулка',
  90: 'глубокий сон',
}

/** Exposure (session length) picker: segmented presets + custom slider, mono numerals. */
export function ExposureDial({ minutes, onChange }: { minutes: number; onChange: (m: number) => void }) {
  const reduce = useReducedMotion()
  const [custom, setCustom] = useState(() => !PRESETS.includes(minutes as (typeof PRESETS)[number]))
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(t)
  }, [])

  const fill = ((minutes - MIN) / (MAX - MIN)) * 100
  const h = Math.floor(minutes / 60)
  const m = minutes % 60

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-2" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={minutes}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(4px)' }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="tabular font-mono text-stat-xl font-medium text-text-1"
            >
              {h > 0 ? `${h}:${String(m).padStart(2, '0')}` : minutes}
            </motion.span>
          </AnimatePresence>
          <span className="text-body text-text-2">{h > 0 ? 'ч' : pluralRu(minutes, ['минута', 'минуты', 'минут'])}</span>
        </div>
        <p className="pb-1.5 text-right text-caption text-text-3">
          готово около
          <br />
          <span className="tabular font-mono text-mono-sm text-text-2">{formatTime(now + minutes * 60_000)}</span>
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Выдержка"
        className="mt-4 grid grid-cols-5 gap-1 rounded-full border border-border bg-surface-1 p-1"
      >
        {PRESETS.map((p) => {
          const active = !custom && minutes === p
          return (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${p} минут — ${presetHint[p]}`}
              onClick={() => {
                setCustom(false)
                onChange(p)
              }}
              className={
                'relative h-11 rounded-full font-mono text-mono-sm tabular transition-colors duration-200 ' +
                (active ? 'text-bg' : 'text-text-2 hover:text-text-1')
              }
            >
              {active && (
                <motion.span
                  layoutId="exposure-pill"
                  className="absolute inset-0 rounded-full bg-text-1 shadow-md"
                  transition={reduce ? { duration: 0 } : { type: 'spring', duration: 0.45, bounce: 0.15 }}
                />
              )}
              <span className="relative">{p}′</span>
            </button>
          )
        })}
        <button
          type="button"
          role="radio"
          aria-checked={custom}
          onClick={() => setCustom(true)}
          className={
            'relative h-11 rounded-full text-body-sm transition-colors duration-200 ' +
            (custom ? 'text-bg' : 'text-text-2 hover:text-text-1')
          }
        >
          {custom && (
            <motion.span
              layoutId="exposure-pill"
              className="absolute inset-0 rounded-full bg-text-1 shadow-md"
              transition={reduce ? { duration: 0 } : { type: 'spring', duration: 0.45, bounce: 0.15 }}
            />
          )}
          <span className="relative">своя</span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {custom && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0.1 : 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              <label htmlFor="exposure-range" className="sr-only">
                Своя выдержка, минут
              </label>
              <input
                id="exposure-range"
                type="range"
                min={MIN}
                max={MAX}
                step={5}
                value={minutes}
                aria-valuetext={`${minutes} ${pluralRu(minutes, ['минута', 'минуты', 'минут'])}`}
                onChange={(e) => onChange(Number(e.target.value))}
                className="dr-range"
                style={{ ['--fill' as string]: `${fill}%` }}
              />
              <div className="mt-1 flex justify-between font-mono text-[11px] text-text-3 tabular" aria-hidden>
                <span>5′</span>
                <span>1 ч</span>
                <span>2 ч</span>
                <span>3 ч</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
