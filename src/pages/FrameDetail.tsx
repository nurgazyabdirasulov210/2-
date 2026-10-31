import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Share2, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CircleMark } from '../components/album/AlbumFilters'
import { GreaseCircle } from '../components/album/GreaseCircle'
import { PrintTicket } from '../components/album/PrintTicket'
import { edgeNumber, frameParams, getFilm } from '../components/album/films'
import { FrameCanvas } from '../components/FrameCanvas'
import { Button } from '../components/ui/Button'
import { exportFramePNG } from '../engine'
import { getDemoFrames, isDemoId } from '../lib/demo'
import { formatDate } from '../lib/format'
import { useStudio } from '../store'
import type { Frame } from '../types'

async function makePNG(frame: Frame): Promise<Blob> {
  const film = getFilm(frame.film)
  return exportFramePNG(frameParams(frame), {
    title: frame.intention || `Кадр № ${frame.number}`,
    subtitle: `${film.name} · ${formatDate(frame.startedAt)} · Проявка`,
  })
}

const fileName = (f: Frame) => `proyavka-kadr-${String(f.number).padStart(3, '0')}.png`

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export default function FrameDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const storeFrames = useStudio((s) => s.frames)
  const toggleFavorite = useStudio((s) => s.toggleFavorite)
  const deleteFrame = useStudio((s) => s.deleteFrame)
  const demo = isDemoId(id) && !storeFrames.some((f) => f.id === id)
  const frames = useMemo(
    () => [...(demo ? getDemoFrames() : storeFrames)].sort((a, b) => a.number - b.number),
    [demo, storeFrames],
  )
  const index = frames.findIndex((f) => f.id === id)
  const frame = index >= 0 ? frames[index] : null
  const prev = index > 0 ? frames[index - 1] : null
  const next = index >= 0 && index < frames.length - 1 ? frames[index + 1] : null
  const q = demo ? '?demo=1' : ''

  const [status, setStatus] = useState<string>('')
  const [busy, setBusy] = useState<'download' | 'share' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setConfirmDelete(false)
    setStatus('')
  }, [id])

  const go = useCallback((f: Frame | null) => f && navigate(`/album/${f.id}${q}`, { replace: true }), [navigate, q])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowLeft') go(prev)
      else if (e.key === 'ArrowRight') go(next)
      else if (e.key === 'Escape') navigate('/album')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, prev, next, navigate])

  if (!frame) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-4 py-24 text-center">
        <p className="text-overline uppercase text-text-3">Кадр не найден</p>
        <h1 className="font-display text-display-lg italic">Этого отпечатка нет в альбоме</h1>
        <p className="text-body text-text-2">Возможно, он был удалён или альбом очищен.</p>
        <Link to="/album" className="text-body-sm text-accent underline-offset-4 hover:underline">
          ← К контактному листу
        </Link>
      </div>
    )
  }

  const film = getFilm(frame.film)

  const onDownload = async () => {
    setBusy('download')
    try {
      downloadBlob(await makePNG(frame), fileName(frame))
      setStatus('Отпечаток сохранён в загрузки.')
    } catch {
      setStatus('Не удалось подготовить PNG. Попробуйте ещё раз.')
    } finally {
      setBusy(null)
    }
  }

  const onShare = async () => {
    setBusy('share')
    try {
      const blob = await makePNG(frame)
      const file = new File([blob], fileName(frame), { type: 'image/png' })
      const data: ShareData = {
        files: [file],
        title: `Проявка · кадр № ${frame.number}`,
        text: frame.intention ? `«${frame.intention}» — проявлено без экрана.` : 'Проявлено без экрана.',
      }
      if (navigator.canShare?.(data) && navigator.share) {
        await navigator.share(data)
        setStatus('')
      } else {
        downloadBlob(blob, fileName(frame))
        setStatus('Поделиться напрямую нельзя в этом браузере — отпечаток скачан.')
      }
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') setStatus('Не удалось поделиться кадром.')
    } finally {
      setBusy(null)
    }
  }

  const onDelete = () => {
    if (!confirmDelete) return setConfirmDelete(true)
    const target = next ?? prev
    deleteFrame(frame.id)
    navigate(target ? `/album/${target.id}` : '/album', { replace: true })
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 overflow-x-clip px-4 pb-32 pt-6 sm:px-6 sm:pt-10 lg:px-8">
        <nav aria-label="Навигация по кадрам" className="flex items-center justify-between gap-3">
          <Link
            to="/album"
            className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full pr-3 text-body-sm text-text-2 transition-colors hover:text-text-1"
          >
            <ArrowLeft className="size-4" aria-hidden /> Контактный лист
          </Link>
          <div className="flex items-center gap-1">
            <NavButton to={prev ? `/album/${prev.id}${q}` : null} label="Предыдущий кадр">
              <ChevronLeft className="size-5" aria-hidden />
            </NavButton>
            <span className="min-w-[4.5rem] text-center font-mono text-mono-sm text-text-2 tabular">
              {edgeNumber(frame.number)} <span className="text-text-3">/ {edgeNumber(frames.length)}</span>
            </span>
            <NavButton to={next ? `/album/${next.id}${q}` : null} label="Следующий кадр">
              <ChevronRight className="size-5" aria-hidden />
            </NavButton>
          </div>
        </nav>

        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
          {/* the print */}
          <div className="relative lg:col-span-7">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-10 -z-10 opacity-60 blur-3xl"
              style={{ background: `radial-gradient(50% 45% at 50% 45%, ${film.swatch[1]}33, transparent 70%)` }}
            />
            <figure
              className="relative mx-auto w-full max-w-[min(560px,calc((100dvh-180px)*0.72))] rotate-[-0.4deg] rounded-[2px] bg-paper p-[5.5%] pb-[4%]"
              style={{
                boxShadow:
                  '0 40px 80px -30px rgba(0,0,0,.75), 0 18px 30px -18px rgba(0,0,0,.6), 0 0 0 1px rgba(0,0,0,.25), inset 0 0 0 1px rgba(255,255,255,.5)',
                minWidth: 'min(100%, 260px)',
              }}
            >
              <div className="relative">
                <motion.div layoutId={`frame-${frame.id}`} transition={{ type: 'spring', duration: 0.5, bounce: 0.12 }}>
                  <FrameCanvas
                    params={frameParams(frame)}
                    label={`Кадр ${frame.number}, ${film.name}${frame.intention ? `: ${frame.intention}` : ''}`}
                    className="shadow-[inset_0_0_0_1px_rgba(0,0,0,.15)]"
                  />
                </motion.div>
                <AnimatePresence>
                  {frame.favorite && <GreaseCircle key={frame.id} seed={frame.seed} show bleed="-4%" width={1.1} />}
                </AnimatePresence>
              </div>
              <figcaption className="flex items-end justify-between gap-4 pt-[5%] text-paper-ink">
                <span className="min-w-0 font-display text-[clamp(1.05rem,0.8rem+1vw,1.5rem)] italic leading-tight">
                  {frame.intention || 'Без подписи'}
                </span>
                <span className="shrink-0 text-right font-mono text-[10px] uppercase tracking-[0.14em] opacity-60">
                  № {edgeNumber(frame.number)}
                  <br />
                  {film.short}
                </span>
              </figcaption>
            </figure>
          </div>

          {/* the ticket + actions */}
          <div className="flex flex-col gap-5 lg:col-span-5">
            <PrintTicket frame={frame} total={frames.length} />

            <div className="flex flex-wrap gap-2">
              {!demo && (
                <Button
                  variant={frame.favorite ? 'primary' : 'ghost'}
                  aria-pressed={frame.favorite}
                  onClick={() => toggleFavorite(frame.id)}
                >
                  <CircleMark className="size-5" />
                  {frame.favorite ? 'Обведено' : 'Обвести'}
                </Button>
              )}
              <Button variant="ghost" onClick={onDownload} disabled={busy !== null}>
                <Download className="size-4" aria-hidden /> {busy === 'download' ? 'Печатаем…' : 'PNG'}
              </Button>
              <Button variant="ghost" onClick={onShare} disabled={busy !== null}>
                <Share2 className="size-4" aria-hidden /> Поделиться
              </Button>
              {!demo && (
                <div className="ml-auto flex items-center gap-1">
                  {confirmDelete && (
                    <Button variant="quiet" size="md" onClick={() => setConfirmDelete(false)}>
                      Отмена
                    </Button>
                  )}
                  <Button
                    variant="quiet"
                    onClick={onDelete}
                    className={confirmDelete ? '!bg-danger/15 !text-danger' : 'hover:!text-danger'}
                    aria-label={confirmDelete ? 'Подтвердить удаление кадра' : 'Удалить кадр'}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    {confirmDelete ? 'Точно удалить?' : 'Удалить'}
                  </Button>
                </div>
              )}
            </div>
            <p role="status" aria-live="polite" className="min-h-5 text-body-sm text-text-2">
              {status ||
                (demo ? (
                  'Это кадр из примера — отмечать и удалять можно только свои кадры.'
                ) : (
                  <span className="hidden text-text-3 lg:inline">
                    <kbd className="font-mono">←</kbd> <kbd className="font-mono">→</kbd> листать ·{' '}
                    <kbd className="font-mono">Esc</kbd> к листу
                  </span>
                ))}
            </p>
          </div>
        </div>
      </div>
    </MotionConfig>
  )
}

function NavButton({ to, label, children }: { to: string | null; label: string; children: ReactNode }) {
  const cls = 'inline-flex size-11 items-center justify-center rounded-full transition-colors'
  if (!to)
    return (
      <span aria-disabled className={`${cls} text-text-3/40`} aria-label={label}>
        {children}
      </span>
    )
  return (
    <Link to={to} replace aria-label={label} className={`${cls} text-text-2 hover:bg-surface-2 hover:text-text-1`}>
      {children}
    </Link>
  )
}
