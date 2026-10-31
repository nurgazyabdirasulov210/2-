import type { ReactNode } from 'react'
import { Reveal } from '../ui/Reveal'

export function SectionHead({
  index,
  overline,
  title,
  lead,
  align = 'left',
}: {
  index?: string
  overline: string
  title: ReactNode
  lead?: ReactNode
  align?: 'left' | 'center'
}) {
  return (
    <Reveal className={`max-w-[46rem] ${align === 'center' ? 'mx-auto text-center' : ''}`}>
      <p className={`mb-5 flex items-center gap-3 font-mono text-overline text-text-3 uppercase ${align === 'center' ? 'justify-center' : ''}`}>
        {index && <span className="text-accent">{index}</span>}
        {index && <span aria-hidden className="h-px w-6 bg-border-strong" />}
        {overline}
      </p>
      <h2 className="font-display text-display-lg font-medium text-balance text-text-1">{title}</h2>
      {lead && <p className="mt-5 text-body-lg text-pretty text-text-2">{lead}</p>}
    </Reveal>
  )
}
