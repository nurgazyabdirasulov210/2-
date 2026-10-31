import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import AppShell from './components/shell/AppShell'
import Landing from './pages/Landing'
import Darkroom from './pages/Darkroom'
import Album from './pages/Album'
import FrameDetail from './pages/FrameDetail'
import Stats from './pages/Stats'
import SettingsPage from './pages/Settings'
import NotFound from './pages/NotFound'
import { Toaster } from './components/ui/Toast'
import { useDarkroomWatcher } from './lib/visibility'

const APP_ROUTES = ['/darkroom', '/album', '/stats', '/settings']

/** Top-level sections cross-fade (landing ↔ app ↔ 404); routes inside the app animate in AppShell. */
function sectionOf(pathname: string) {
  if (pathname === '/') return 'landing'
  if (APP_ROUTES.some((p) => pathname === p || pathname.startsWith(p + '/'))) return 'app'
  return 'other'
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={sectionOf(location.pathname)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, ease: [0.2, 0, 0, 1] } }}
        exit={{ opacity: 0, transition: { duration: 0.16, ease: [0.55, 0, 1, 0.45] } }}
      >
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route element={<AppShell />}>
            <Route path="/darkroom" element={<Darkroom />} />
            <Route path="/album" element={<Album />} />
            <Route path="/album/:id" element={<FrameDetail />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  // Session transitions (visibility → door open/close, completion) must work on every page.
  useDarkroomWatcher()
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AnimatedRoutes />
        <Toaster />
      </BrowserRouter>
    </MotionConfig>
  )
}
