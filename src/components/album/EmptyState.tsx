import { ArrowRight, Eye } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { useDemoPreview } from '../../lib/demo'
import { EDGE_INK, Perforations, STRIP_BASE } from './FilmStrip'

/** An unexposed strip of film: frame outlines only, softly breathing. */
export function EmptyStrip() {
  const cells = 5
  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-3xl -rotate-[0.6deg] rounded-[3px] shadow-lg"
      style={{ background: `linear-gradient(180deg, #17120e, ${STRIP_BASE} 20%, ${STRIP_BASE} 80%, #17120e)` }}
    >
      <Perforations className="top-[15px]" lit={0.1} />
      <Perforations className="bottom-[15px]" lit={0.1} />
      <div className="grid grid-cols-3 sm:grid-cols-5">
        {Array.from({ length: cells }, (_, i) => (
          <div key={i} className={`relative px-[6px] py-[30px] ${i >= 3 ? 'max-sm:hidden' : ''}`}>
            <span
              className="absolute left-2 top-[1px] font-mono text-[9px] uppercase leading-[14px] tracking-[0.14em] sm:text-[10px]"
              style={{ color: EDGE_INK, opacity: 0.55 }}
            >
              {i === 0 ? 'ПРОЯВКА 400' : `▸ ${String(i + 1).padStart(2, '0')}`}
            </span>
            <div
              className="aspect-[4/5] w-full animate-breathe rounded-[1px] border border-dashed border-[#EFE9DF]/40"
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function EmptyInvite({
  overline,
  title,
  body,
  visual,
}: {
  overline: string
  title: string
  body: ReactNode
  visual?: ReactNode
}) {
  const navigate = useNavigate()
  const showDemo = useDemoPreview((s) => s.set)
  return (
    <section className="flex flex-col items-center gap-10 py-10 text-center sm:py-16">
      {visual ?? <EmptyStrip />}
      <div className="flex max-w-xl flex-col items-center gap-4">
        <p className="text-overline uppercase text-text-3">{overline}</p>
        <h2 className="font-display text-display-lg italic text-text-1">{title}</h2>
        <p className="text-body text-text-2">{body}</p>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Button variant="safelight" size="lg" onClick={() => navigate('/darkroom')}>
          В тёмную комнату <ArrowRight className="size-5" aria-hidden />
        </Button>
        <Button variant="ghost" size="lg" onClick={() => showDemo(true)}>
          <Eye className="size-5" aria-hidden /> Посмотреть пример
        </Button>
      </div>
    </section>
  )
}

/** Banner shown while browsing the in-memory example album. */
export function DemoBanner({ onLoad }: { onLoad(): void }) {
  const hide = useDemoPreview((s) => s.set)
  return (
    <div role="status" className="glass flex flex-col gap-3 rounded-lg px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-body-sm text-text-2">
        <span className="mr-2 font-mono text-caption uppercase tracking-[0.12em] text-accent">Пример</span>
        Это демонстрационный альбом — он не сохраняется, пока вы его не загрузите.
      </p>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="quiet" onClick={() => hide(false)}>
          Скрыть
        </Button>
        <Button size="sm" variant="ghost" onClick={onLoad}>
          Загрузить пример
        </Button>
      </div>
    </div>
  )
}
