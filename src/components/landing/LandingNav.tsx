import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wordmark } from '../shell/Wordmark'

const LINKS = [
  { href: '#how', label: 'Как это работает' },
  { href: '#rule', label: 'Правило' },
  { href: '#films', label: 'Плёнки' },
  { href: '#faq', label: 'Вопросы' },
]

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-4">
      <nav
        aria-label="Навигация по странице"
        className={`mx-auto flex h-14 max-w-[1200px] items-center gap-4 rounded-full pr-2 pl-4 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ${
          scrolled ? 'glass shadow-md' : 'border border-transparent'
        }`}
      >
        <Link to="/" aria-label="Проявка" className="text-text-1">
          <Wordmark />
        </Link>
        <ul className="ml-auto hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="rounded-full px-3.5 py-2 text-body-sm text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <Link
          to="/album"
          className="ml-auto hidden rounded-full px-3.5 py-2 text-body-sm text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1 sm:inline-flex lg:ml-0"
        >
          Мои кадры
        </Link>
        <Link
          to="/darkroom"
          className="ml-auto inline-flex h-10 items-center rounded-full bg-text-1 px-4 text-body-sm font-medium text-bg shadow-md transition-[transform,background-color] duration-200 hover:bg-text-1/88 active:scale-[0.97] sm:ml-0"
        >
          Войти
        </Link>
      </nav>
    </header>
  )
}
