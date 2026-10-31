import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Reveal } from '../ui/Reveal'
import { SectionHead } from './SectionHead'

const QA: [string, string][] = [
  [
    'Нужно держать вкладку открытой?',
    'Нет. Можно свернуть браузер, переключиться на другую вкладку или заблокировать телефон — проявка считается по часам, а не по таймеру на странице. Когда вернётесь, кадр будет ждать.',
  ],
  [
    'Что считается подглядыванием?',
    'Если вы вернулись на вкладку до конца экспозиции, дверь тёмной комнаты открывается. Есть несколько секунд, чтобы закрыть её и уйти. Каждое такое возвращение оставляет на кадре световой след. Время на возврат настраивается.',
  ],
  [
    'А если я сдамся раньше?',
    'Нажмите «Остановить» — кадр уйдёт в туман, но всё равно ляжет в альбом. Засвеченные кадры тоже красивые, и они честные.',
  ],
  [
    'Это правда без AI?',
    'Правда. Каждый кадр — результат генеративного алгоритма с номером-зерном: одно зерно, одна плёнка, одно время суток дают ровно одну картинку. Повторить её нельзя, только проявить новую.',
  ],
  [
    'Где хранятся мои кадры?',
    'Только в вашем браузере (localStorage). Мы их не видим, потому что у нас нет сервера. В настройках есть экспорт и импорт JSON — чтобы перенести альбом на другое устройство или просто сделать копию.',
  ],
  [
    'Сколько это стоит?',
    'Ничего. Без подписки, рекламы и «пробного периода». Если понравится — расскажите другу, который слишком долго смотрит в телефон.',
  ],
  [
    'Работает на телефоне?',
    'Да, в любом современном браузере. Можно добавить на главный экран, и Проявка откроется как отдельное приложение.',
  ],
]

function Item({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  const id = useId()
  const reduce = useReducedMotion()
  return (
    <li className="border-b border-border">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
          className="group flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left"
        >
          <span className={`font-display text-h2 font-medium transition-colors md:text-h1 ${open ? 'text-text-1' : 'text-text-1/85 group-hover:text-text-1'}`}>{q}</span>
          <span
            aria-hidden
            className={`grid size-9 shrink-0 place-items-center rounded-full border transition-[transform,background-color,border-color] duration-300 ease-out-quint ${
              open ? 'rotate-45 border-accent/50 bg-accent/10 text-accent' : 'border-border-strong text-text-2'
            }`}
          >
            <Plus className="size-4" />
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0.1 : 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-[44rem] pb-7 text-body text-pretty text-text-2">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="relative scroll-mt-24 px-4 py-24 md:px-8 md:py-36">
      <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHead index="06" overline="Вопросы" title={<>Спрашивают <em className="font-normal text-accent-soft">чаще всего</em></>} />
        </div>
        <Reveal delay={0.1} className="lg:col-span-8">
          <ul className="border-t border-border">
            {QA.map(([q, a], i) => (
              <Item key={q} q={q} a={a} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
