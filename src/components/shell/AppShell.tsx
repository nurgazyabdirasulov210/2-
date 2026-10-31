import { useEffect, useRef } from 'react'
import { Link, NavLink, useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import { Aperture, BookOpen, LayoutGrid, Settings2, type LucideIcon } from 'lucide-react'
import { useStudio } from '../../store'
import { Wordmark } from './Wordmark'

interface NavItem {
  to: string
  label: string
  short: string
  icon: LucideIcon
}

export const NAV: NavItem[] = [
  { to: '/darkroom', label: 'Тёмная комната', short: 'Комната', icon: Aperture },
  { to: '/album', label: 'Контактный лист', short: 'Лист', icon: LayoutGrid },
  { to: '/stats', label: 'Журнал', short: 'Журнал', icon: BookOpen },
  { to: '/settings', label: 'Настройки', short: 'Настройки', icon: Settings2 },
]

/** Keeps the outlet element of the route that is exiting, so AnimatePresence can animate it out. */
function FrozenOutlet() {
  const outlet = useOutlet()
  const ref = useRef(outlet)
  ref.current ??= outlet
  return ref.current
}

function PillNav({ hidden }: { hidden: boolean }) {
  const reduce = useReducedMotion()
  return (
    <motion.nav
      aria-label="Основная навигация"
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      initial={false}
      animate={hidden ? { opacity: 0, y: reduce ? 0 : 24, scale: 0.96 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: hidden ? 0.4 : 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="glass fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-xl p-1.5 shadow-lg md:inset-x-auto md:top-4 md:bottom-auto md:left-1/2 md:max-w-none md:-translate-x-1/2 md:rounded-full"
      style={{ pointerEvents: hidden ? 'none' : undefined }}
    >
      <LayoutGroup id="pill-nav">
        <ul className="grid grid-cols-4 gap-1 md:flex md:gap-0.5">
          {NAV.map(({ to, label, short, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `relative flex h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] leading-none font-medium transition-colors duration-150 md:h-10 md:flex-row md:gap-2 md:rounded-full md:px-4 md:text-body-sm ${
                    isActive ? 'text-text-1' : 'text-text-2 hover:text-text-1'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        aria-hidden
                        className="absolute inset-0 rounded-lg bg-surface-3 shadow-sm ring-1 ring-border md:rounded-full"
                        transition={{ type: 'spring', duration: 0.45, bounce: 0.15 }}
                      />
                    )}
                    <Icon aria-hidden strokeWidth={1.75} className={`relative size-5 md:size-4 ${isActive ? 'text-accent' : ''}`} />
                    <span className="relative md:hidden">{short}</span>
                    <span className="relative hidden md:inline">{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </LayoutGroup>
    </motion.nav>
  )
}

export default function AppShell() {
  const location = useLocation()
  const phase = useStudio((s) => s.phase)
  const immersive = phase === 'developing' || phase === 'door-open'
  const reduce = useReducedMotion()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname])

  return (
    <div className="relative min-h-dvh">
      <a
        href="#main"
        className="sr-only z-[99] rounded-full bg-text-1 px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        К содержимому
      </a>

      <motion.header
        initial={false}
        animate={{ opacity: immersive ? 0 : 1 }}
        transition={{ duration: 0.4 }}
        inert={immersive || undefined}
        className="pointer-events-none fixed inset-x-0 top-0 z-40 flex h-16 items-center px-4 md:h-[72px] md:px-8"
      >
        <Link
          to="/"
          aria-label="Проявка — на главную"
          className="pointer-events-auto -mx-2 rounded-full px-2 py-1 text-text-1 transition-opacity hover:opacity-80"
        >
          <Wordmark />
        </Link>
      </motion.header>

      <PillNav hidden={immersive} />

      <main
        id="main"
        className="relative px-4 pt-16 pb-[calc(112px+env(safe-area-inset-bottom))] md:px-8 md:pt-24 md:pb-16"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: reduce ? 0.12 : 0.4, ease: [0.2, 0, 0, 1] } }}
            exit={reduce ? { opacity: 0, transition: { duration: 0.09 } } : { opacity: 0, y: -8, transition: { duration: 0.16, ease: [0.55, 0, 1, 0.45] } }}
          >
            <FrozenOutlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
