import { useMemo, useState, type ReactNode } from 'react'
import { DoorOpen, Moon } from 'lucide-react'
import { FrameCanvas } from '../FrameCanvas'
import { Reveal } from '../ui/Reveal'
import { Slider } from '../ui/Slider'
import { pluralRu } from '../../lib/format'
import { SectionHead } from './SectionHead'
import { demoParams } from './films'

const SEED = 412907

function Print({ children, caption, tilt }: { children: ReactNode; caption: ReactNode; tilt: number }) {
  return (
    <figure className="group">
      <div
        className="bg-paper p-2.5 pb-10 shadow-lg transition-transform duration-500 ease-out-quint group-hover:rotate-0 sm:p-3 sm:pb-12"
        style={{ transform: `rotate(${tilt}deg)` }}
      >
        <div className="relative overflow-hidden">{children}</div>
      </div>
      <figcaption className="mt-5 text-body-sm text-text-2">{caption}</figcaption>
    </figure>
  )
}

export function HonestRule() {
  const [peeks, setPeeks] = useState(3)
  const clean = useMemo(() => demoParams('portra', SEED, 18), [])
  const fogged = useMemo(() => demoParams('portra', SEED, 18, peeks, true), [peeks])

  return (
    <section id="rule" className="relative scroll-mt-24 overflow-hidden px-4 py-24 md:px-8 md:py-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-strong to-transparent" />
      <div className="mx-auto grid max-w-[1200px] gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5 lg:pt-6">
          <SectionHead
            index="02"
            overline="Честное правило"
            title={
              <>
                Подглядел&nbsp;— <em className="font-normal text-accent-soft">засветил</em>.
              </>
            }
            lead="Вернулись к экрану раньше времени — дверь тёмной комнаты открыта, и свет падает на бумагу. Мы ничего не блокируем и ни за что не ругаем. Кадр всё равно ваш, просто он помнит, как всё было."
          />
          <Reveal delay={0.1} className="mt-10 space-y-5">
            <div className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-surface-2 text-text-2"><DoorOpen className="size-5" aria-hidden /></span>
              <p className="text-body text-text-2">
                <span className="text-text-1">Дверь открыта.</span> Есть несколько секунд, чтобы закрыть её и уйти обратно, — тогда засвет совсем лёгкий.
              </p>
            </div>
            <div className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-surface-2 text-text-2"><Moon className="size-5" aria-hidden /></span>
              <p className="text-body text-text-2">
                <span className="text-text-1">Каждое подглядывание</span> добавляет световой след. Сдались — кадр уходит в туман, но остаётся в альбоме.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="lg:col-span-7">
          <div className="grid grid-cols-2 gap-5 sm:gap-10">
            <Print tilt={-1.5} caption={<><span className="text-text-1">Чистый кадр.</span> 45&nbsp;минут без экрана.</>}>
              <FrameCanvas params={clean} label="Чистый кадр без засветов" />
            </Print>
            <Print
              tilt={1.8}
              caption={
                <>
                  <span className="text-text-1">Засвеченный.</span> Вернулись раньше, {peeks}&nbsp;{pluralRu(peeks, ['подглядывание', 'подглядывания', 'подглядываний'])}.
                </>
              }
            >
              <FrameCanvas params={fogged} label={`Засвеченный кадр: ${peeks} подглядываний`} />
            </Print>
          </div>
          <div className="card mt-10 p-5 sm:p-6">
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor="peek-slider" className="text-body-sm text-text-2">
                Сколько раз подглядеть?
              </label>
              <span className="font-mono text-mono-sm text-text-1 tabular">{peeks}</span>
            </div>
            <Slider
              id="peek-slider"
              min={0}
              max={6}
              step={1}
              ticks
              value={peeks}
              onChange={setPeeks}
              format={(v) => `${v} ${pluralRu(v, ['раз', 'раза', 'раз'])}`}
            />
            <p className="text-caption text-text-3">Это настоящий генератор: тот же кадр, те же формулы — меняется только свет.</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
