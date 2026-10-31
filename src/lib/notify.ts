// Notification API + document.title helpers. All functions are safe to call anywhere (never throw).
import { formatClock } from './format'

export const APP_TITLE = 'Проявка'

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported'
}

/** Ask for permission (must be called from a user gesture). Resolves true if granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (!notificationsSupported()) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const res = await Notification.requestPermission()
    return res === 'granted'
  } catch {
    return false
  }
}

/** Show a notification if permitted. Clicking it focuses the tab. Returns true if shown. */
export function notify(title: string, body?: string): boolean {
  try {
    if (!notificationsSupported() || Notification.permission !== 'granted') return false
    const n = new Notification(title, { body, tag: 'proyavka', icon: '/favicon.svg', silent: false })
    n.onclick = () => {
      try {
        window.focus()
      } catch {
        /* ignore */
      }
      n.close()
    }
    return true
  } catch {
    return false
  }
}

/** The "frame developed" notification. Only fires while the tab is hidden. */
export function notifyFrameDeveloped(frameNumber?: number, intention?: string): boolean {
  if (typeof document !== 'undefined' && !document.hidden) return false
  const head = frameNumber ? `Кадр №${frameNumber} проявлен` : 'Кадр проявлен'
  const body = intention ? `«${intention}» — загляните в тёмную комнату.` : 'Загляните в тёмную комнату.'
  return notify(head, body)
}

const PHASE_GLYPHS = ['○', '◔', '◑', '◕', '●']

/** "◐ 12:04 · Проявка" style title while developing; glyph fills as progress grows. */
export function sessionTitle(remainingMs: number, progress: number, doorOpen = false): string {
  if (doorOpen) return `◌ Дверь открыта · ${APP_TITLE}`
  const g = PHASE_GLYPHS[Math.min(PHASE_GLYPHS.length - 1, Math.floor(Math.max(0, progress) * (PHASE_GLYPHS.length - 1)))]
  return `${g} ${formatClock(remainingMs)} · ${APP_TITLE}`
}

let baseTitle: string | null = null

export function setSessionTitle(remainingMs: number, progress: number, doorOpen = false): void {
  if (typeof document === 'undefined') return
  if (baseTitle == null) baseTitle = document.title || APP_TITLE
  const t = sessionTitle(remainingMs, progress, doorOpen)
  if (document.title !== t) document.title = t
}

export function resetTitle(): void {
  if (typeof document === 'undefined') return
  if (baseTitle != null) {
    document.title = baseTitle
    baseTitle = null
  }
}
