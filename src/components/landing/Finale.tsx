import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '../ui/Reveal'
import { Wordmark } from '../shell/Wordmark'

export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden px-4 py-28 text-center md:px-8 md:py-44">
      <div aria-hidden className="pointer-events-none absolute bottom-[-30%] left-1/2 -z-10 h-[620px] w-[620px] -translate-x-1/2 animate-breathe rounded-full bg-[radial-gradient(closest-side,var(--safelight-glow),transparent)] blur-2xl [animation-duration:5s]" />
      <Reveal>
        <p className="font-mono text-overline text-text-3 uppercase">Свет сейчас горит</p>
        <h2 className="mx-auto mt-6 max-w-[14ch] font-display text-display-2xl font-medium text-balance text-text-1">
          Погаси его. <em className="font-normal text-accent-soft">Остальное</em> проявится.
        </h2>
        <Link
          to="/darkroom"
          className="group mt-12 inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-safelight px-8 text-body-lg font-medium text-white shadow-[0_0_0_1px_rgba(224,69,58,.5),0_10px_40px_-6px_var(--safelight-glow)] transition-[filter,transform] duration-200 ease-out-quint hover:brightness-110 active:scale-[0.97]"
        >
          Войти в тёмную комнату
          <ArrowRight aria-hidden className="size-5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
        <p className="mt-5 text-body-sm text-text-3">Бесплатно. Без регистрации. Первый кадр — через 10 минут.</p>
      </Reveal>
    </section>
  )
}

const YEAR = new Date().getFullYear()

const LINKS = [
  { to: '/darkroom', label: 'Тёмная комната' },
  { to: '/album', label: 'Контактный лист' },
  { to: '/stats', label: 'Журнал' },
  { to: '/settings', label: 'Настройки' },
]

export function Footer() {
  return (
    <footer className="border-t border-border px-4 pt-14 pb-[calc(2.5rem+env(safe-area-inset-bottom))] md:px-8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Wordmark className="text-text-1" />
          <p className="mt-4 text-body-sm text-text-2">Тёмная комната для офлайн-времени. Сделано вручную, без AI, без серверов и без трекеров.</p>
        </div>
        <nav aria-label="Разделы приложения">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-3 text-body-sm">
            {LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-text-2 transition-colors hover:text-text-1">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mx-auto mt-14 flex max-w-[1200px] flex-col gap-2 font-mono text-caption text-text-3 uppercase sm:flex-row sm:justify-between">
        <span>© {YEAR} Проявка</span>
        <span>Всё хранится в вашем браузере</span>
      </div>
    </footer>
  )
}
