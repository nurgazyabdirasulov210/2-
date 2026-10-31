import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { FrameCanvas } from '../components/FrameCanvas'
import { Reveal } from '../components/ui/Reveal'
import { Wordmark } from '../components/shell/Wordmark'

export default function NotFound() {
  const { pathname } = useLocation()
  const params = useMemo(() => ({ film: 'ilford' as const, seed: 404, hour: 3, peeks: 6, fogged: true, weather: null }), [])
  useEffect(() => {
    document.title = 'Кадр не проявился · Проявка'
  }, [])

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-x-clip px-4 md:px-8">
      <div aria-hidden className="pointer-events-none absolute top-[10%] left-1/2 -z-10 h-[560px] w-[560px] -translate-x-1/2 animate-breathe rounded-full bg-[radial-gradient(closest-side,var(--safelight-glow),transparent)] blur-2xl" />
      <header className="flex h-16 items-center md:h-20">
        <Link to="/" aria-label="Проявка — на главную" className="text-text-1">
          <Wordmark />
        </Link>
      </header>
      <main id="main" className="mx-auto grid w-full max-w-[1000px] flex-1 items-center gap-12 py-10 md:grid-cols-[minmax(0,340px)_1fr] md:gap-16">
        <Reveal className="mx-auto w-full max-w-[260px] md:max-w-none">
          <div className="rotate-[-2deg] bg-paper p-3 pb-12 shadow-lg">
            <FrameCanvas params={params} label="Полностью засвеченный кадр" maxDpr={1.5} />
            <p className="mt-3 text-center font-mono text-[10px] tracking-[0.16em] text-paper-ink/60 uppercase">№ 404 · засвечен</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="font-mono text-overline text-text-3 uppercase">Ошибка 404</p>
          <h1 className="mt-4 font-display text-display-xl font-medium text-balance text-text-1">
            Этот кадр <em className="font-normal text-accent-soft">не&nbsp;проявился</em>.
          </h1>
          <p className="mt-6 max-w-[30rem] text-body-lg text-text-2">
            Похоже, кто-то открыл дверь раньше времени. Страницы{' '}
            <code className="rounded-xs bg-surface-2 px-1.5 py-0.5 font-mono text-mono-sm break-all text-text-1">{pathname}</code> здесь нет — но плёнки ещё полно.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/darkroom"
              className="inline-flex h-12 items-center justify-center rounded-full bg-safelight px-6 font-medium text-white shadow-[0_10px_40px_-6px_var(--safelight-glow)] transition-[filter,transform] hover:brightness-110 active:scale-[0.97]"
            >
              Проявить новый кадр
            </Link>
            <Link to="/" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border-strong px-6 text-text-1 transition-colors hover:bg-surface-2">
              <ArrowLeft aria-hidden className="size-4" />
              На главную
            </Link>
          </div>
        </Reveal>
      </main>
    </div>
  )
}
