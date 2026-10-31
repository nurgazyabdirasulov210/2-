import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

/** Scroll-driven reveal (fade-up + blur), once. Collapses to a short fade with prefers-reduced-motion. */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  className = '',
  as = 'div',
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  as?: 'div' | 'section' | 'li' | 'article' | 'header' | 'span'
}) {
  const reduce = useReducedMotion()
  const M = motion[as]
  return (
    <M
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={reduce ? { duration: 0.12 } : { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </M>
  )
}
