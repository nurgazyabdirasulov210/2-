// Route-level code splitting. Landing stays in the entry chunk; app pages load on demand
// and are prefetched when the browser is idle so navigation from the landing feels instant.
import { lazy } from 'react'

const loaders = {
  darkroom: () => import('../pages/Darkroom'),
  album: () => import('../pages/Album'),
  frame: () => import('../pages/FrameDetail'),
  stats: () => import('../pages/Stats'),
  settings: () => import('../pages/Settings'),
  notFound: () => import('../pages/NotFound'),
}

export const DarkroomPage = lazy(loaders.darkroom)
export const AlbumPage = lazy(loaders.album)
export const FrameDetailPage = lazy(loaders.frame)
export const StatsPage = lazy(loaders.stats)
export const SettingsPage = lazy(loaders.settings)
export const NotFoundPage = lazy(loaders.notFound)

let prefetched = false
/** Warm all route chunks (idempotent). */
export function prefetchRoutes(): void {
  if (prefetched) return
  prefetched = true
  for (const load of Object.values(loaders)) load().catch(() => {
    prefetched = false
  })
}
