// Toast queue (no React) — `toast()` can be called from anywhere.
import { create } from 'zustand'

export type ToastTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

export interface ToastOptions {
  tone?: ToastTone
  /** ms before auto-dismiss; default 4000 (6000 with an action). 0 = sticky. */
  duration?: number
  action?: { label: string; onClick: () => void }
  /** Secondary line under the message. */
  description?: string
}

export interface ToastItem extends Required<Pick<ToastOptions, 'tone' | 'duration'>> {
  id: number
  message: string
  description?: string
  action?: ToastOptions['action']
}

interface ToastStore {
  items: ToastItem[]
  push(item: ToastItem): void
  dismiss(id: number): void
}

export const useToastStore = create<ToastStore>()((set) => ({
  items: [],
  push: (item) => set((s) => ({ items: [...s.items, item].slice(-3) })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}))

let counter = 0

/** Show a toast from anywhere (no hook needed). Returns its id. */
export function toast(message: string, opts: ToastOptions = {}): number {
  const id = ++counter
  useToastStore.getState().push({
    id,
    message,
    description: opts.description,
    action: opts.action,
    tone: opts.tone ?? 'neutral',
    duration: opts.duration ?? (opts.action ? 6000 : 4000),
  })
  return id
}
toast.dismiss = (id: number) => useToastStore.getState().dismiss(id)
