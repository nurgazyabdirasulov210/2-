import type { ReactNode } from 'react'

/** Data tooltip (glass), positioned by percentages inside a relative chart box. Points at (x%, y%). */
export function ChartTooltip({
  x,
  y,
  overline,
  dot,
  children,
  context,
}: {
  x: number
  y: number
  overline: string
  dot?: string
  children: ReactNode
  context?: ReactNode
}) {
  // keep it inside the box horizontally
  const shift = x < 18 ? '-12%' : x > 82 ? '-88%' : '-50%'
  return (
    <div
      role="presentation"
      className="pointer-events-none absolute z-20 w-max max-w-[15rem]"
      style={{ left: `${x}%`, top: `${y}%`, transform: `translate(${shift}, calc(-100% - 10px))` }}
    >
      <div
        className="animate-[tip-in_160ms_cubic-bezier(0.22,1,0.36,1)_both] rounded-sm border border-border px-3 py-2 shadow-lg backdrop-blur-sm"
        style={{ background: 'color-mix(in oklch, var(--surface-3) 88%, transparent)' }}
      >
      <p className="flex items-center gap-1.5 text-overline uppercase text-text-2">
        {dot && <span className="size-2 rounded-full" style={{ background: dot }} aria-hidden />}
        {overline}
      </p>
      <p className="mt-0.5 text-body-sm font-semibold text-text-1 tabular">{children}</p>
      {context && <p className="text-caption text-text-2">{context}</p>}
      </div>
      <style>{'@keyframes tip-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}'}</style>
    </div>
  )
}
