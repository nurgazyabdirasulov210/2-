import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Download, LayoutGrid, Plus, Share2 } from 'lucide-react'
import { exportFramePNG } from '../../engine'
import { useStudio } from '../../store'
import { formatDate, formatDuration, formatTime, pluralRu } from '../../lib/format'
import { Button } from '../ui/Button'
import { toast } from '../ui/Toast'
import { FrameCanvas } from '../FrameCanvas'
import type { Frame } from '../../types'
import { Clothespin } from './Clothespin'
import { LeakMarkers } from './LeakMarkers'
import { weatherIcon } from './WeatherChip'
import { downloadBlob, filmOf, frameParams, signedTemp } from './util'

/** Animate development from `from` to 1 — the last phase of the print "coming up" in front of you. */
function useRevealProgress(from: number, durationMs: number, delayMs: number, instant: boolean) {
  const [p, setP] = useState(instant ? 1 : from)
  useEffect(() => {
    if (instant) {
      setP(1)
      return
    }
    let raf = 0
    let last = 0
    const t0 = performance.now() + delayMs
    const step = (t: number) => {
      const k = Math.min(1, Math.max(0, (t - t0) / durationMs))
      // throttle canvas redraws to ~16 fps; easing out
      if (t - last > 60 || k >= 1) {
        last = t
        const e = 1 - Math.pow(1 - k, 3)
        setP(from + (1 - from) * e)
      }
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [from, durationMs, delayMs, instant])
  return p
}

function captionFor(frame: Frame) {
  const film = filmOf(frame.film)
  const title = `Кадр №${frame.number}${frame.intention ? ` — ${frame.intention}` : ''}`
  const parts = [film.name, formatDuration(frame.fogged ? frame.developedMs : frame.durationMs), formatDate(frame.finishedAt)]
  if (frame.weather) parts.push(`${frame.weather.label}, ${signedTemp(frame.weather.temperature)}`)
  return { title, subtitle: parts.join(' · ') }
}

/** Phase 4 — the reveal ritual: the print hangs on a line with a wooden clothespin, swinging and dripping. */
export function RevealLine({ frame }: { frame: Frame }) {
  const reduce = !!useReducedMotion()
  const navigate = useNavigate()
  const dismissResult = useStudio((s) => s.dismissResult)
  const params = useMemo(() => frameParams(frame), [frame])
  const film = filmOf(frame.film)
  const progress = useRevealProgress(0.55, 3400, 900, reduce)
  const [busy, setBusy] = useState<'save' | 'share' | null>(null)
  const ease = [0.22, 1, 0.36, 1] as const

  const makeBlob = () => {
    const c = captionFor(frame)
    return exportFramePNG(params, c, 2000)
  }
  const filename = `proyavka-kadr-${frame.number}.png`

  const save = async () => {
    setBusy('save')
    try {
      downloadBlob(await makeBlob(), filename)
      toast('Отпечаток сохранён', { tone: 'success', description: filename })
    } catch {
      toast('Не удалось сохранить PNG', { tone: 'danger' })
    } finally {
      setBusy(null)
    }
  }

  const share = async () => {
    setBusy('share')
    try {
      const blob = await makeBlob()
      const file = new File([blob], filename, { type: 'image/png' })
      const data: ShareData = {
        files: [file],
        title: `Проявка — кадр №${frame.number}`,
        text: frame.intention ? `«${frame.intention}» — ${formatDuration(frame.developedMs)} без экрана.` : `${formatDuration(frame.developedMs)} без экрана.`,
      }
      if (navigator.canShare?.(data) && navigator.share) {
        await navigator.share(data)
      } else {
        downloadBlob(blob, filename)
        toast('Поделиться напрямую нельзя — сохранил PNG', { description: filename })
      }
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') toast('Не получилось поделиться', { tone: 'danger' })
    } finally {
      setBusy(null)
    }
  }

  const W = frame.weather
  const WIcon = W ? weatherIcon(W) : null

  return (
    <motion.div
      className="mx-auto w-full max-w-[1180px] overflow-x-clip"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
    >
      {/* lights coming back on */}
      {typeof document !== 'undefined' &&
        createPortal(
          <motion.div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[70] bg-[#050304]"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.12 : 1.6, ease: [0.65, 0, 0.35, 1] }}
          />,
          document.body,
        )}

      <div className="grid items-center gap-6 md:gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
        {/* ---------- the line ---------- */}
        <div className="relative h-[min(128vw,560px)] lg:h-[min(78dvh,720px)]">
          {/* soft light bloom behind the print */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-[-20%] right-[-20%] top-[-10%] bottom-[-10%]"
            style={{
              background:
                'radial-gradient(46% 44% at 50% 46%, rgba(255,226,186,.30) 0%, rgba(255,196,140,.12) 42%, rgba(255,196,140,0) 72%)',
              mixBlendMode: 'screen',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduce ? 0.12 : 3.2, delay: reduce ? 0 : 1.2, ease }}
          />
          {/* string */}
          <svg viewBox="0 0 1000 40" preserveAspectRatio="none" className="absolute inset-x-[-16px] top-6 h-10 w-[calc(100%+32px)]" aria-hidden>
            <path d="M0 6 Q500 34 1000 6" fill="none" stroke="var(--text-3)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
            <path d="M0 7 Q500 35 1000 7" fill="none" stroke="#000" strokeOpacity=".35" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </svg>
          {/* empty pins along the line, for composition */}
          <Clothespin className="absolute left-[9%] top-[22px] w-[13px] rotate-[6deg] opacity-60" />
          <Clothespin className="absolute right-[10%] top-[21px] w-[13px] -rotate-[5deg] opacity-60" />

          {/* the print: rises from the tray, then hangs and swings from the centre pin */}
          <motion.div
            className="absolute left-1/2 top-[40px] w-[min(70vw,330px)] -translate-x-1/2 lg:w-[min(32vw,380px)]"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 260 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.12 : 1.1, ease }}
          >
            <div className={reduce ? '' : 'dr-sway'}>
              <motion.div
                style={{ transformOrigin: '50% 0%' }}
                initial={reduce ? false : { rotate: -11 }}
                animate={{ rotate: 0 }}
                transition={{ type: 'spring', stiffness: 34, damping: 3.4, mass: 1, delay: 0.85 }}
              >
                <Clothespin className="absolute left-1/2 top-[-26px] z-10 w-[22px] -translate-x-1/2 drop-shadow-[0_4px_4px_rgba(0,0,0,.45)]" />
                <div className="relative rounded-[3px] bg-paper p-[4.5%] pb-[15%] shadow-[0_30px_60px_-20px_rgba(0,0,0,.7),0_10px_20px_-10px_rgba(0,0,0,.5)]">
                  <div className="relative overflow-hidden">
                    <FrameCanvas params={params} progress={progress} label={`Кадр №${frame.number}${frame.intention ? `: ${frame.intention}` : ''}`} />
                    {/* wet sheen fading as it dries */}
                    <motion.div
                      aria-hidden
                      className="pointer-events-none absolute inset-0"
                      style={{ background: 'linear-gradient(125deg, rgba(255,255,255,.28), transparent 35%, transparent 60%, rgba(255,255,255,.12))' }}
                      initial={{ opacity: reduce ? 0 : 1 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 6, delay: 1.5 }}
                    />
                  </div>
                  <div className="absolute inset-x-[4.5%] bottom-0 flex h-[15%] items-center justify-between">
                    <span className="font-display text-[clamp(1.05rem,2.6vw,1.35rem)] italic text-paper-ink/80">№{frame.number}</span>
                    <span className="font-mono text-[10px] tracking-[0.16em] text-paper-ink/50">{film.short}</span>
                  </div>
                  {/* drips */}
                  {!reduce && (
                    <>
                      <span className="dr-drip" style={{ left: '22%', animationDelay: '1.8s', animationIterationCount: 4 }} />
                      <span className="dr-drip" style={{ left: '61%', animationDelay: '3.1s', animationIterationCount: 3 }} />
                      <span className="dr-drip" style={{ left: '83%', animationDelay: '4.6s', animationIterationCount: 2 }} />
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* ---------- caption ---------- */}
        <motion.div
          className="relative pb-6"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: reduce ? 0 : 1.8, ease }}
        >
          <p className={'text-overline uppercase ' + (frame.fogged ? 'text-warning' : 'text-accent')}>
            {frame.fogged ? 'Кадр засвечен' : 'Кадр проявлен'}
          </p>
          <h1 className="mt-3 font-display text-display-xl font-medium text-text-1">
            Кадр <span className="italic">№{frame.number}</span>
          </h1>
          {frame.intention && (
            <p className="mt-3 font-display text-h1 italic leading-snug text-text-2">«{frame.intention}»</p>
          )}
          <p className="mt-4 max-w-[44ch] text-body text-text-2">
            {frame.fogged
              ? 'Свет попал на бумагу раньше времени. Это честный след — кадр всё равно ляжет в контактный лист.'
              : frame.peeks > 0
                ? frame.peeks === 1
                  ? 'Проявлен — с одним следом света. Подглядывание оставило засвет на бумаге.'
                  : 'Проявлен — со следами света. Каждое подглядывание оставило свой засвет.'
                : `${formatDuration(frame.durationMs)} без экрана. Ни одного подглядывания — чистый отпечаток.`}
          </p>

          <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5">
            <div>
              <dt className="text-overline uppercase text-text-3">Плёнка</dt>
              <dd className="mt-1 flex items-center gap-2 text-body text-text-1">
                <span className="flex gap-0.5" aria-hidden>
                  {film.swatch.map((c, i) => (
                    <span key={i} className="h-2.5 w-1.5 rounded-[2px]" style={{ background: c }} />
                  ))}
                </span>
                {film.name}
              </dd>
            </div>
            <div>
              <dt className="text-overline uppercase text-text-3">Выдержка</dt>
              <dd className="mt-1 font-mono text-mono-sm text-text-1 tabular">
                {frame.fogged
                  ? `${formatDuration(frame.developedMs)} из ${formatDuration(frame.durationMs)}`
                  : formatDuration(frame.durationMs)}
              </dd>
            </div>
            <div>
              <dt className="text-overline uppercase text-text-3">Засветы</dt>
              <dd className="mt-1 flex items-center gap-2 text-body text-text-1">
                {frame.peeks > 0 ? (
                  <>
                    <LeakMarkers count={frame.peeks} />
                    <span className="text-body-sm text-text-2">
                      {frame.peeks} {pluralRu(frame.peeks, ['подглядывание', 'подглядывания', 'подглядываний'])}
                    </span>
                  </>
                ) : (
                  <span className="text-body-sm text-text-2">нет — чистый</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-overline uppercase text-text-3">{W ? 'Погода' : 'Когда'}</dt>
              <dd className="mt-1 flex items-center gap-2 text-body-sm text-text-1">
                {W && WIcon ? (
                  <>
                    <WIcon className="h-4 w-4 shrink-0 text-text-2" aria-hidden />
                    <span>
                      {W.label}, <span className="whitespace-nowrap font-mono tabular">{signedTemp(W.temperature)}</span>
                    </span>
                  </>
                ) : (
                  <span className="font-mono text-mono-sm tabular">
                    {formatDate(frame.finishedAt)}, {formatTime(frame.finishedAt)}
                  </span>
                )}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap gap-2.5">
            <Button variant="primary" size="lg" onClick={save} disabled={busy !== null}>
              <Download className="h-5 w-5" aria-hidden />
              {busy === 'save' ? 'Печатаю…' : 'Сохранить PNG'}
            </Button>
            <Button variant="ghost" size="lg" onClick={share} disabled={busy !== null}>
              <Share2 className="h-5 w-5" aria-hidden />
              {busy === 'share' ? 'Готовлю…' : 'Поделиться'}
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            <Button
              variant="quiet"
              onClick={() => {
                navigate('/album')
                dismissResult()
              }}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />В контактный лист
            </Button>
            <Button variant="quiet" onClick={dismissResult}>
              <Plus className="h-4 w-4" aria-hidden />
              Ещё кадр
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
