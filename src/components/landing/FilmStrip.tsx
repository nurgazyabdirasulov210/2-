import { useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { FrameCanvas } from '../FrameCanvas'
import { Reveal } from '../ui/Reveal'
import { SectionHead } from './SectionHead'
import { demoParams, films, HERO_SEEDS } from './films'
import type { Film } from '../../types'

function Sprockets() {
  return (
    <div aria-hidden className="flex h-5 items-center justify-around px-1">
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className="h-2.5 w-3.5 rounded-[3px] bg-bg shadow-[inset_0_1px_1px_rgba(0,0,0,.6)]" />
      ))}
    </div>
  )
}

function FilmFrame({ film, i }: { film: Film; i: number }) {
  const shot = HERO_SEEDS.find((s) => s.film === film.id)
  const params = useMemo(() => demoParams(film.id, (shot?.seed ?? 1000) + 7, shot?.hour ?? 17), [film.id, shot])
  return (
    <li className="w-[232px] shrink-0 snap-start sm:w-[280px]">
      <div className="bg-[#0E0C0B] px-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,.03)]">
        <Sprockets />
        <div className="flex items-center justify-between pb-1.5 font-mono text-[9px] tracking-[0.18em] text-[#E8A13A]/80 uppercase">
          <span>{film.short}</span>
          <span className="tabular">▸ {i * 2 + 1}A</span>
        </div>
        <div className="group relative overflow-hidden rounded-[2px]">
          <FrameCanvas
            params={params}
            label={`Пример кадра: ${film.name}`}
            maxDpr={1.5}
            className="transition-transform duration-700 ease-out-quint group-hover:scale-[1.03]"
          />
        </div>
        <div className="flex items-center justify-between pt-1.5 font-mono text-[9px] tracking-[0.18em] text-[#E8A13A]/60 uppercase">
          <span className="tabular">{String(i * 2 + 1).padStart(2, '0')}</span>
          <span>◂ ПРОЯВКА</span>
        </div>
        <Sprockets />
      </div>
      <div className="px-1 pt-5 pr-6">
        <div className="flex items-center gap-2.5">
          <span className="flex -space-x-1" aria-hidden>
            {film.swatch.map((c) => (
              <span key={c} className="size-3 rounded-full ring-2 ring-bg" style={{ background: c }} />
            ))}
          </span>
          <h3 className="font-display text-h2 font-medium text-text-1">{film.name}</h3>
        </div>
        <p className="mt-1.5 text-body-sm text-text-2">{film.description}</p>
      </div>
    </li>
  )
}

export function FilmStrip() {
  const scroller = useRef<HTMLUListElement>(null)
  const list = films()
  const by = (dir: number) => scroller.current?.scrollBy({ left: dir * 300, behavior: 'smooth' })

  return (
    <section id="films" className="relative scroll-mt-24 py-24 md:py-36">
      <div className="mx-auto flex max-w-[1200px] items-end justify-between gap-8 px-4 md:px-8">
        <SectionHead
          index="03"
          overline="Шесть плёнок"
          title={
            <>
              У каждой плёнки <em className="font-normal text-accent-soft">свой характер</em>.
            </>
          }
          lead="Один и тот же час без экрана выглядит по-разному: тёплый пейзаж, ночной город, синий отпечаток трав. Кадр зависит от плёнки, времени суток и даже погоды за окном."
        />
        <div className="hidden shrink-0 gap-2 md:flex">
          <button type="button" aria-label="Прокрутить назад" onClick={() => by(-1)} className="grid size-11 cursor-pointer place-items-center rounded-full border border-border-strong text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1">
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" aria-label="Прокрутить вперёд" onClick={() => by(1)} className="grid size-11 cursor-pointer place-items-center rounded-full border border-border-strong text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1">
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
      <Reveal delay={0.1} className="relative mt-14 md:mt-16">
        <ul
          ref={scroller}
          tabIndex={0}
          aria-label="Плёнки"
          className="flex snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] md:scroll-px-8 md:px-8 xl:scroll-px-[max(2rem,calc((100vw-1200px)/2+2rem))] xl:px-[max(2rem,calc((100vw-1200px)/2+2rem))] [&::-webkit-scrollbar]:hidden"
        >
          {list.map((f, i) => (
            <FilmFrame key={f.id} film={f} i={i} />
          ))}
        </ul>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-bg to-transparent" />
      </Reveal>
    </section>
  )
}
