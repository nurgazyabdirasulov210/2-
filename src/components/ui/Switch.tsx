import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  /** Accessible label when there is no visible <label htmlFor>. */
  'aria-label'?: string
  id?: string
  /** Shows a subtle spinner-ish pulse while an async permission is pending. */
  busy?: boolean
}

/** iOS-like switch, role="switch". 44px hit area. */
export function Switch({ checked, onChange, disabled, id, busy, ...rest }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-busy={busy || undefined}
      aria-label={rest['aria-label']}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`group relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border p-0.5 transition-colors duration-200 ease-out-quint disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? 'border-transparent bg-accent' : 'border-border-strong bg-surface-3'
      } ${busy ? 'animate-pulse' : ''} before:absolute before:-inset-2 before:content-['']`}
    >
      <motion.span
        aria-hidden
        className={`block size-[22px] rounded-full shadow-md ${checked ? 'bg-on-accent' : 'bg-text-1'}`}
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 520, damping: 34 }}
      />
    </button>
  )
}

/** A settings row: title + hint on the left, control on the right. */
export function SettingRow({
  title,
  hint,
  icon,
  control,
  children,
  htmlFor,
}: {
  title: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  control?: ReactNode
  children?: ReactNode
  htmlFor?: string
}) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-4">
        {icon && (
          <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-sm bg-surface-2 text-text-2">
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          {htmlFor ? (
            <label htmlFor={htmlFor} className="block cursor-pointer text-body font-medium text-text-1">
              {title}
            </label>
          ) : (
            <p className="text-body font-medium text-text-1">{title}</p>
          )}
          {hint && <p className="mt-0.5 text-body-sm text-text-2">{hint}</p>}
        </div>
        {control}
      </div>
      {children}
    </div>
  )
}
