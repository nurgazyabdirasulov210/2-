import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FrameCanvas } from '../FrameCanvas'
import { demoParams, filmById, HERO_SEEDS } from './films'

const DEVELOP_MS = 6000
const HOLD_MS = 2400
const FADE_MS = 500
const FPS = 30

/** Chemistry is slow to start and slow to finish. */
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) * 0.85 + t * 0.15

/**
 * Hero live demo: a sheet of paper in a tray that develops 0→1 under a safelight, looping through films.
 * Pauses off-screen / in background tabs. Reduced motion → a static, fully developed frame.
 */
export function DevelopingDemo() {
  const reduce = useReducedMotion()
  const [idx, setIdx] = useState(0)
  const [rawProgress, setProgress] = useState(0)
  const progress = reduce ? 1 : rawProgress
  const [visible, setVisible] = useState(true)
  const root = useRef<HTMLDivElement>(null)
  // persists across pauses (off-screen) so the loop resumes where it was; first run starts a little in
  const elapsedRef = useRef(1400)
  const shot = HERO_SEEDS[idx % HERO_SEEDS.length]
  const film = filmById(shot.film)
  const params = useMemo(() => demoParams(shot.film, shot.seed, shot.hour), [shot])

  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (reduce || !visible) return
    let raf = 0
    let last = 0
    let prev = performance.now()
    const tick = (now: number) => {
      // ignore huge gaps (background tab) so the loop resumes smoothly
      elapsedRef.current += Math.min(100, now - prev)
      const elapsed = elapsedRef.current
      prev = now
      if (elapsed >= DEVELOP_MS + HOLD_MS + FADE_MS) {
        setIdx((i) => i + 1)
        setProgress(0)
        elapsedRef.current = 0
      } else if (now - last >= 1000 / FPS) {
        last = now
        setProgress(Math.min(1, ease(Math.min(1, elapsed / DEVELOP_MS))))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduce, visible])

  const pct = Math.round(progress * 100)
  const frameNo = String(((idx % 36) + 1) * 3 + 4).padStart(2, '0')

  return (
    <div ref={root} className="relative mx-auto w-full max-w-[400px]">
      {/* breathing safelight */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-16 -top-24 -bottom-10 -z-10 animate-breathe rounded-full bg-[radial-gradient(closest-side,var(--safelight-glow),transparent)] blur-2xl"
        style={{ animationDuration: '5s' }}
      />
      {/* safelight lamp */}
      <div aria-hidden className="mx-auto mb-5 flex w-fit items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-safelight/90 uppercase">
        <span className="relative grid size-2 place-items-center">
          <span className="absolute size-3 animate-ping rounded-full bg-safelight/40 [animation-duration:2.4s]" />
          <span className="size-2 rounded-full bg-safelight shadow-[0_0_12px_2px_var(--safelight)]" />
        </span>
        Неактиничный свет
      </div>

      {/* tray */}
      <div className="relative rounded-[28px] border border-white/[0.06] bg-[linear-gradient(180deg,#17110F,#0C0908)] p-5 shadow-lg sm:p-7">
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(120%_70%_at_50%_0%,rgba(224,69,58,.18),transparent_60%)]" />
        {/* liquid sheen */}
        <div aria-hidden className="pointer-events-none absolute inset-3 rounded-[20px] bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,.04)_45%,transparent_60%)]" />
        <motion.div
          className="relative rotate-[-1.5deg] bg-paper p-2.5 pb-9 shadow-[0_30px_60px_-20px_rgba(0,0,0,.8)] sm:p-3 sm:pb-11"
          animate={{ opacity: progress === 0 && !reduce ? 0.4 : 1 }}
          transition={{ duration: FADE_MS / 1000 }}
        >
          <div className="relative overflow-hidden">
            <FrameCanvas params={params} progress={progress} label={`Демо: кадр на плёнке ${film.name} проявляется`} maxDpr={1.5} />
            {/* safelight wash fades as the print develops */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-safelight mix-blend-multiply"
              style={{ opacity: 0.22 * (1 - progress) }}
            />
            {/* wet sheen until ~0.9 */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,.18),transparent_35%,transparent_70%,rgba(255,255,255,.06))]"
              style={{ opacity: progress < 0.9 ? 1 : Math.max(0, 1 - (progress - 0.9) * 10) }}
            />
          </div>
          <div className="absolute inset-x-3 bottom-2.5 flex items-center justify-between font-mono text-[10px] tracking-[0.14em] text-paper-ink/60 uppercase sm:bottom-3.5">
            <span>{film.short}</span>
            <span className="tabular">№ {frameNo}</span>
          </div>
        </motion.div>
      </div>

      {/* readout */}
      <div className="mt-5 flex items-center gap-3 font-mono text-[11px] tracking-[0.12em] text-text-2 uppercase" aria-live="off">
        <span className="flex gap-1" aria-hidden>
          {film.swatch.map((c) => (
            <span key={c} className="size-2.5 rounded-full ring-1 ring-white/10" style={{ background: c }} />
          ))}
        </span>
        <span className="truncate">{film.name}</span>
        <span className="ml-auto tabular text-text-1">{pct === 100 ? 'Проявлено' : `${String(pct).padStart(2, '0')}%`}</span>
      </div>
      <div aria-hidden className="mt-2 h-px w-full overflow-hidden bg-border">
        <div className="h-full bg-safelight" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
