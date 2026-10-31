import { Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import AppShell from './components/shell/AppShell'
import Landing from './pages/Landing'
import { Toaster } from './components/ui/Toast'
import { useDarkroomWatcher } from './lib/visibility'
import { useStudio } from './store'
import {
  AlbumPage,
  DarkroomPage,
  FrameDetailPage,
  NotFoundPage,
  prefetchRoutes,
  SettingsPage,
  StatsPage,
} from './app/routes'

const APP_ROUTES = ['/darkroom', '/album', '/stats', '/settings']

/** Top-level sections cross-fade (landing ↔ app ↔ 404); routes inside the app animate in AppShell. */
function sectionOf(pathname: string) {
  if (pathname === '/') return 'landing'
  if (APP_ROUTES.some((p) => pathname === p || pathname.startsWith(p + '/'))) return 'app'
  return 'other'
}

/** While the lights are off the only place to be is the dark room (deep links / back button included). */
function useSessionRoute(): boolean {
  const location = useLocation()
  const immersive = useStudio((s) => s.session != null && (s.phase === 'developing' || s.phase === 'door-open'))
  return immersive && location.pathname !== '/darkroom'
}

function AnimatedRoutes() {
  const location = useLocation()
  const redirect = useSessionRoute()
  if (redirect) return <Navigate to="/darkroom" replace />
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={sectionOf(location.pathname)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, ease: [0.2, 0, 0, 1] } }}
        exit={{ opacity: 0, transition: { duration: 0.16, ease: [0.55, 0, 1, 0.45] } }}
      >
        <Suspense fallback={<div className="min-h-dvh" />}>
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route element={<AppShell />}>
              <Route path="/darkroom" element={<DarkroomPage />} />
              <Route path="/album" element={<AlbumPage />} />
              <Route path="/album/:id" element={<FrameDetailPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

function usePrefetchRoutes() {
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
    if (w.requestIdleCallback) {
      w.requestIdleCallback(prefetchRoutes, { timeout: 4000 })
    } else {
      const t = window.setTimeout(prefetchRoutes, 2500)
      return () => window.clearTimeout(t)
    }
  }, [])
}

export default function App() {
  // Session transitions (visibility → door open/close, completion) must work on every page.
  useDarkroomWatcher()
  usePrefetchRoutes()
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AnimatedRoutes />
        <Toaster />
      </BrowserRouter>
    </MotionConfig>
  )
}
