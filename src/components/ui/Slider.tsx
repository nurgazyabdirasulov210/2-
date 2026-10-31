import { useId, useState } from 'react'

export interface SliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Human value for screen readers and the floating badge, e.g. v => `${v} с`. */
  format?: (value: number) => string
  'aria-label'?: string
  id?: string
  disabled?: boolean
  /** Render tick dots for each step (only if ≤ 24 steps). */
  ticks?: boolean
  /** Called on pointer/key release with the final value. */
  onCommit?: (value: number) => void
  className?: string
}

/**
 * Native range input styled per design spec: 4px track, accent gradient fill,
 * 20px thumb that grows on drag with a ring, floating glass value badge while dragging.
 */
export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  format = (v) => String(v),
  id,
  disabled,
  ticks,
  onCommit,
  className = '',
  ...rest
}: SliderProps) {
  const autoId = useId()
  const [drag, setDrag] = useState(false)
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0
  const steps = Math.round((max - min) / step)
  const showTicks = ticks && steps > 0 && steps <= 24

  return (
    <div className={`group relative h-11 select-none ${className}`}>
      {/* track */}
      <div aria-hidden className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-surface-3">
        <div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent to-accent-soft transition-shadow ${
            drag ? 'shadow-[0_0_12px_-2px_var(--accent)]' : ''
          }`}
          style={{ width: `calc(10px + (100% - 20px) * ${pct / 100})` }}
        />
      </div>
      {showTicks && (
        <div aria-hidden className="pointer-events-none absolute inset-x-[10px] top-1/2 flex -translate-y-1/2 justify-between">
          {Array.from({ length: steps + 1 }, (_, i) => (
            <span
              key={i}
              className={`size-0.5 rounded-full ${min + i * step <= value ? 'bg-on-accent/50' : 'bg-text-3'}`}
            />
          ))}
        </div>
      )}
      {/* thumb (visual) */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2"
        style={{ left: `calc(10px + (100% - 20px) * ${pct / 100})` }}
      >
        <div
          className={`-translate-x-1/2 -translate-y-1/2 rounded-full bg-text-1 shadow-md group-has-[input:focus-visible]:outline-2 group-has-[input:focus-visible]:outline-offset-2 group-has-[input:focus-visible]:outline-focus transition-[width,height,box-shadow] duration-150 ease-out-quint ${
            drag ? 'size-6 ring-8 ring-accent/25' : 'size-5'
          }`}
        />
        <div
          className={`glass absolute bottom-5 left-0 -translate-x-1/2 rounded-sm px-2 py-1 font-mono text-mono-sm whitespace-nowrap text-text-1 shadow-lg transition-[opacity,transform] duration-150 ${
            drag ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
          }`}
        >
          {format(value)}
        </div>
      </div>
      <input
        id={id ?? autoId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={rest['aria-label']}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerDown={() => setDrag(true)}
        onPointerUp={() => {
          setDrag(false)
          onCommit?.(value)
        }}
        onPointerCancel={() => setDrag(false)}
        onKeyUp={() => onCommit?.(value)}
        onBlur={() => setDrag(false)}
        className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
      />
    </div>
  )
}
