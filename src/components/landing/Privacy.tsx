import { CircleSlash, HardDrive, UserX } from 'lucide-react'
import { Reveal } from '../ui/Reveal'
import { SectionHead } from './SectionHead'

const ITEMS = [
  {
    icon: CircleSlash,
    title: 'Без AI.',
    body: 'Кадры рисует детерминированный генератор: формулы, шум и зерно. Никаких нейросетей, промптов и чужих фотографий в обучении.',
  },
  {
    icon: UserX,
    title: 'Без аккаунта.',
    body: 'Ни почты, ни пароля, ни «войти через». Открыли страницу — и можно гасить свет.',
  },
  {
    icon: HardDrive,
    title: 'Всё в вашем браузере.',
    body: 'Кадры, статистика и настройки хранятся только на этом устройстве. Выгрузить их в файл можно в любой момент.',
  },
]

export function Privacy() {
  return (
    <section id="privacy" className="relative scroll-mt-24 px-4 py-24 md:px-8 md:py-36">
      <div className="mx-auto max-w-[1200px]">
        <SectionHead
          index="05"
          overline="Приватность"
          title={
            <>
              Ваше <span className="whitespace-nowrap">офлайн-время</span> <em className="font-normal text-accent-soft">не&nbsp;становится чьими-то данными</em>.
            </>
          }
        />
        <div className="mt-14 grid gap-4 md:mt-20 md:grid-cols-3 md:gap-5">
          {ITEMS.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 0.08} className="card relative overflow-hidden p-7">
              <Icon aria-hidden strokeWidth={1.5} className="size-7 text-accent" />
              <h3 className="mt-10 font-display text-display-lg leading-none font-medium text-text-1">{title}</h3>
              <p className="mt-4 text-body text-pretty text-text-2">{body}</p>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1}>
          <p className="mt-8 max-w-[44rem] text-body-sm text-text-3">
            Погода — только если вы сами разрешите. Тогда координаты один раз уходят в открытый сервис Open-Meteo, чтобы узнать, идёт ли
            дождь, и больше никуда. Без ключей, трекеров и рекламы.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
