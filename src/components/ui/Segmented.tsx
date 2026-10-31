import { useId, useRef, type ReactNode, type KeyboardEvent } from 'react'
import { motion } from 'framer-motion'

export interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
  icon?: ReactNode
  disabled?: boolean
}

export interface SegmentedProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: readonly SegmentedOption<T>[]
  'aria-label': string
  size?: 'sm' | 'md'
  /** Stretch segments to fill the container. */
  block?: boolean
  className?: string
}

/** Radio-group style segmented control with an animated thumb (layoutId). Arrow keys move selection. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  block,
  className = '',
  ...rest
}: SegmentedProps<T>) {
  const uid = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKey = (e: KeyboardEvent, i: number) => {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const n = options.length
    for (let k = 1; k <= n; k++) {
      const j = (i + dir * k + n) % n
      if (!options[j].disabled) {
        onChange(options[j].value)
        refs.current[j]?.focus()
        break
      }
    }
  }

  const h = size === 'sm' ? 'h-8 px-3 text-body-sm' : 'h-10 px-4 text-body-sm'
  return (
    <div
      role="radiogroup"
      aria-label={rest['aria-label']}
      className={`${block ? 'flex w-full' : 'inline-flex'} rounded-full border border-border bg-surface-2 p-1 ${className}`}
    >
      {options.map((o, i) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={`relative inline-flex ${block ? 'flex-1' : ''} cursor-pointer items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-colors duration-150 disabled:opacity-40 ${h} ${
              active ? 'text-text-1' : 'text-text-2 hover:text-text-1'
            }`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${uid}`}
                aria-hidden
                className="absolute inset-0 rounded-full bg-surface-3 shadow-sm ring-1 ring-border-strong"
                transition={{ type: 'spring', duration: 0.45, bounce: 0.15 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {o.icon}
              {o.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
