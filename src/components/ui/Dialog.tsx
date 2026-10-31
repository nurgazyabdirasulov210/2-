import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from './Button'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  /** Action row (buttons). */
  footer?: ReactNode
  /** max width in px on desktop; default 480 */
  width?: number
  /** Hide the corner close button. */
  hideClose?: boolean
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'

/** Accessible modal. Bottom sheet on mobile, centered card on ≥640px. Esc + overlay click close, focus trapped. */
export function Dialog({ open, onClose, title, description, children, footer, width = 480, hideClose }: DialogProps) {
  const titleId = useId()
  const descId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = window.setTimeout(() => {
      const el = panel.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE)
      el?.focus()
    }, 30)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
      } else if (e.key === 'Tab' && panel.current) {
        const els = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE))
        if (!els.length) return
        const first = els[0]
        const last = els[els.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      prev?.focus?.()
    }
  }, [open])

  if (typeof document === 'undefined') return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <div data-no-peek className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-[var(--blur-lg)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.16 } }}
            onClick={() => onCloseRef.current()}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            style={{ maxWidth: width }}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.16, ease: [0.55, 0, 1, 0.45] } }}
            transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
            className="relative w-full rounded-t-xl border border-border bg-surface-1 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-lg sm:rounded-xl sm:pb-6"
          >
            <div aria-hidden className="mx-auto -mt-2 mb-4 h-1 w-9 rounded-full bg-text-3/50 sm:hidden" />
            {!hideClose && (
              <button
                type="button"
                aria-label="Закрыть"
                onClick={() => onCloseRef.current()}
                className="absolute top-4 right-4 grid size-9 cursor-pointer place-items-center rounded-full text-text-3 transition-colors hover:bg-surface-2 hover:text-text-1"
              >
                <X className="size-4" />
              </button>
            )}
            <h2 id={titleId} className="pr-10 font-display text-h1 text-text-1">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-2 text-body text-text-2">
                {description}
              </p>
            )}
            {children && <div className="mt-5">{children}</div>}
            {footer && <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export interface ConfirmDialogProps {
  open: boolean
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** 'danger' paints the confirm button red. */
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} data-autofocus>
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            className={tone === 'danger' ? '!bg-danger !text-on-accent hover:!brightness-110' : ''}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}
