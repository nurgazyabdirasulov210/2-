import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'

import { useToastStore, type ToastItem, type ToastTone } from './toastStore'

const toneIcon: Record<ToastTone, typeof Info | null> = {
  neutral: null,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
  info: Info,
}
const toneColor: Record<ToastTone, string> = {
  neutral: 'text-text-2',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
}

function ToastView({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss)
  const timer = useRef<number | undefined>(undefined)
  const start = () => {
    if (item.duration > 0) timer.current = window.setTimeout(() => dismiss(item.id), item.duration)
  }
  const stop = () => window.clearTimeout(timer.current)
  useEffect(() => {
    start()
    return stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const Icon = toneIcon[item.tone]
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.16 } }}
      transition={{ type: 'spring', duration: 0.45, bounce: 0.15 }}
      onMouseEnter={stop}
      onMouseLeave={start}
      role={item.tone === 'danger' ? 'alert' : 'status'}
      className="glass pointer-events-auto flex w-full items-start gap-3 rounded-md px-4 py-3 shadow-lg"
    >
      {Icon && <Icon aria-hidden className={`mt-0.5 size-4 shrink-0 ${toneColor[item.tone]}`} />}
      <div className="min-w-0 flex-1">
        <p className="text-body-sm text-text-1">{item.message}</p>
        {item.description && <p className="mt-0.5 text-caption text-text-2">{item.description}</p>}
      </div>
      {item.action && (
        <button
          type="button"
          onClick={() => {
            item.action!.onClick()
            dismiss(item.id)
          }}
          className="-my-1 shrink-0 cursor-pointer rounded-full px-2.5 py-1 text-body-sm font-medium text-accent hover:bg-surface-3"
        >
          {item.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label="Закрыть уведомление"
        onClick={() => dismiss(item.id)}
        className="-m-1 shrink-0 cursor-pointer rounded-full p-1 text-text-3 hover:bg-surface-3 hover:text-text-1"
      >
        <X className="size-4" />
      </button>
    </motion.li>
  )
}

/** Mount once at the app root. */
export function Toaster() {
  const items = useToastStore((s) => s.items)
  return (
    <ol
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-[90] mx-auto flex w-full max-w-[360px] flex-col gap-2 px-4 md:right-6 md:bottom-6 md:left-auto md:mx-0 md:px-0"
    >
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <ToastView key={t.id} item={t} />
        ))}
      </AnimatePresence>
    </ol>
  )
}
