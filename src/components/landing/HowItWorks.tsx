import { useMemo } from 'react'
import { FrameCanvas } from '../FrameCanvas'
import { Reveal } from '../ui/Reveal'
import { SectionHead } from './SectionHead'
import { demoParams, films } from './films'

function FilmChips() {
  return (
    <div className="flex flex-wrap gap-2" aria-hidden>
      {films().map((f, i) => (
        <span
          key={f.id}
          className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 font-mono text-[10px] tracking-[0.1em] uppercase ${
            i === 0 ? 'border-accent/50 bg-accent/10 text-text-1' : 'border-border text-text-3'
          }`}
        >
          <span className="flex -space-x-1">
            {f.swatch.map((c) => (
              <span key={c} className="size-2.5 rounded-full ring-1 ring-black/30" style={{ background: c }} />
            ))}
          </span>
          {f.short}
        </span>
      ))}
    </div>
  )
}

function LightsOff() {
  return (
    <div aria-hidden className="relative flex h-full min-h-[132px] items-center justify-center overflow-hidden rounded-md bg-[#0C0908]">
      <div className="absolute inset-0 animate-breathe bg-[radial-gradient(60%_80%_at_50%_0%,rgba(224,69,58,.45),transparent_70%)]" />
      <div className="relative text-center">
        <p className="font-mono text-[40px] leading-none tracking-tight text-safelight tabular">45:00</p>
        <p className="mt-2 font-mono text-[10px] tracking-[0.2em] text-white/50 uppercase">идёт проявка</p>
      </div>
    </div>
  )
}

function Result() {
  const params = useMemo(() => demoParams('aurora', 88231, 23), [])
  return (
    <div aria-hidden className="flex h-full min-h-[132px] items-center justify-center gap-3">
      {[-6, 0, 5].map((r, i) => (
        <div key={r} className="w-[30%] max-w-[92px] bg-paper p-1 pb-3 shadow-md" style={{ transform: `rotate(${r}deg) translateY(${i === 1 ? -6 : 4}px)` }}>
          <FrameCanvas params={i === 1 ? params : demoParams(i ? 'polaroid' : 'portra', 412907 + i, 17)} maxDpr={1.5} label="" />
        </div>
      ))}
    </div>
  )
}

const STEPS = [
  {
    n: '01',
    title: 'Выбери плёнку',
    body: 'Шесть плёнок — шесть характеров: тёплая Портра, строгий Ильфорд, ночной Синестилл. И сколько продлится экспозиция: от десяти минут до полутора часов.',
    visual: <FilmChips />,
  },
  {
    n: '02',
    title: 'Погаси свет',
    body: 'Сверни вкладку, положи телефон экраном вниз, уйди гулять. Время считается по часам, а не по открытой странице — бумага проявляется, пока тебя нет.',
    visual: <LightsOff />,
  },
  {
    n: '03',
    title: 'Вернись к кадру',
    body: 'Когда экспозиция закончится, тебя ждёт готовый отпечаток — второго такого не будет. Он ляжет на контактный лист рядом с остальными часами без экрана.',
    visual: <Result />,
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-24 px-4 py-24 md:px-8 md:py-36">
      <div className="mx-auto max-w-[1200px]">
        <SectionHead
          index="01"
          overline="Как это работает"
          title={
            <>
              Три шага, и&nbsp;один из&nbsp;них&nbsp;— <em className="font-normal text-accent-soft">ничего не делать</em>.
            </>
          }
        />
        <ol className="mt-14 grid gap-4 md:mt-20 md:grid-cols-3 md:gap-5">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 0.08} className="card flex flex-col p-6 md:p-7">
              <div className="mb-6 flex min-h-[132px] flex-col justify-center">{s.visual}</div>
              <div className="mt-auto flex items-baseline gap-3">
                <span className="font-display text-[2.5rem] leading-none text-text-3 italic">{s.n}</span>
                <h3 className="font-display text-h1 font-medium text-text-1">{s.title}</h3>
              </div>
              <p className="mt-3 text-body text-pretty text-text-2">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
