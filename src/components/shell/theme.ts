// Theme persistence: localStorage 'theme' + <html data-theme>. Applied pre-paint by the inline script in index.html.
export type Theme = 'dark' | 'light'

const META: Record<Theme, string> = { dark: '#0B0D14', light: '#F6F3EE' }

export function getTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem('theme', theme)
  } catch {
    /* private mode */
  }
  const root = document.documentElement
  const apply = () => {
    root.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META[theme])
  }
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (doc.startViewTransition && !reduce) doc.startViewTransition(apply)
  else apply()
}
