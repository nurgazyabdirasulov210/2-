import { useRef, type KeyboardEvent } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import { FILM_LIST } from '../../engine'
import type { Film, FilmId } from '../../types'

/** A film canister drawn in CSS: cap, body with the film's swatch, and a tongue of film with sprocket holes. */
export function FilmCanister({ film, active, size = 'md' }: { film: Film; active: boolean; size?: 'sm' | 'md' }) {
  const [a, b, c] = film.swatch
  const h = size === 'sm' ? 44 : 60
  const w = size === 'sm' ? 30 : 40
  return (
    <div className="relative shrink-0" style={{ width: w + 26, height: h + 8 }} aria-hidden>
      {/* film tongue */}
      <div
        className="absolute top-1/2 rounded-r-[3px] transition-transform duration-500 ease-out-quint"
        style={{
          left: w - 6,
          width: 30,
          height: h * 0.52,
          marginTop: -(h * 0.26),
          background: 'linear-gradient(180deg,#3a2414,#251409 50%,#3a2414)',
          transform: active ? 'translateX(4px)' : 'translateX(-14px)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.04)',
        }}
      >
        <div className="absolute inset-x-1 top-[3px] flex justify-between">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="block h-[3px] w-[3px] rounded-[1px] bg-black/70" />
          ))}
        </div>
        <div className="absolute inset-x-1 bottom-[3px] flex justify-between">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="block h-[3px] w-[3px] rounded-[1px] bg-black/70" />
          ))}
        </div>
      </div>
      {/* cap top */}
      <div
        className="absolute top-0 h-[6px] rounded-t-[3px]"
        style={{ width: w * 0.42, left: w * 0.29, background: 'linear-gradient(90deg,#5b5f6b,#c9ccd3 45%,#4a4d57)' }}
      />
      {/* body */}
      <div
        className="absolute top-[4px] overflow-hidden rounded-[7px]"
        style={{
          left: 0,
          width: w,
          height: h,
          background: `linear-gradient(90deg, ${c} 0%, ${a} 30%, ${b} 62%, ${c} 100%)`,
          boxShadow:
            'inset 6px 0 8px -4px rgba(255,255,255,.35), inset -8px 0 10px -4px rgba(0,0,0,.45), 0 6px 14px -6px rgba(0,0,0,.6)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-[7px] bg-gradient-to-b from-[#d9dbe0] to-[#7d818c]" />
        <div className="absolute inset-x-0 bottom-0 h-[7px] bg-gradient-to-t from-[#d9dbe0] to-[#7d818c]" />
        <div
          className="absolute inset-y-[9px] left-1/2 -translate-x-1/2 font-mono text-[7px] font-medium uppercase leading-none tracking-[0.18em] text-white/85 [writing-mode:vertical-rl] rotate-180 drop-shadow-[0_1px_1px_rgba(0,0,0,.5)]"
          style={{ fontSize: size === 'sm' ? 5.5 : 7 }}
        >
          {film.short}
        </div>
      </div>
    </div>
  )
}

export function FilmPicker({ value, onChange }: { value: FilmId; onChange: (id: FilmId) => void }) {
  const reduce = useReducedMotion()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const films = FILM_LIST

  const onKey = (e: KeyboardEvent, i: number) => {
    let next = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % films.length
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + films.length) % films.length
    if (next < 0) return
    e.preventDefault()
    onChange(films[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div role="radiogroup" aria-label="Плёнка" className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 lg:grid-cols-3">
      {films.map((film, i) => {
        const active = film.id === value
        return (
          <motion.button
            key={film.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(film.id)}
            onKeyDown={(e) => onKey(e, i)}
            whileTap={reduce ? undefined : { scale: 0.97 }}
            className={
              'group relative flex items-center gap-3 overflow-hidden rounded-lg border p-3 pr-4 text-left ' +
              'transition-[border-color,background-color,box-shadow] duration-300 ease-out-quint ' +
              (active
                ? 'border-accent/60 bg-surface-2 shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_35%,transparent),0_14px_40px_-14px_color-mix(in_oklch,var(--accent)_55%,transparent)]'
                : 'border-border bg-surface-1 hover:border-border-strong hover:bg-surface-2')
            }
          >
            {active && !reduce && (
              <motion.span
                layoutId="film-glow"
                className="pointer-events-none absolute inset-0 rounded-lg"
                style={{
                  background: `radial-gradient(120% 90% at 0% 50%, ${film.swatch[0]}2e, transparent 60%)`,
                }}
                transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
              />
            )}
            <FilmCanister film={film} active={active} size="sm" />
            <span className="relative min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate font-display text-[1.3rem] font-medium leading-tight text-text-1">{film.name}</span>
                {active && <Check className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />}
              </span>
              <span className="mt-0.5 block text-caption text-text-2 line-clamp-2">{film.description}</span>
              <span className="mt-2 flex gap-1" aria-hidden>
                {film.swatch.map((c, k) => (
                  <span key={k} className="h-1.5 w-5 rounded-full" style={{ background: c }} />
                ))}
              </span>
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
