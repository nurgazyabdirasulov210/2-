import { useEffect, useRef } from 'react'
import { renderFrame } from '../engine'
import type { FrameParams } from '../types'

/**
 * Shared canvas that renders a generative frame at the given development progress.
 * Sized by its container (CSS), renders at devicePixelRatio (capped at 2), aspect 4:5 by default.
 */
export function FrameCanvas({
  params,
  progress = 1,
  className = '',
  maxDpr = 2,
  label,
}: {
  params: FrameParams
  progress?: number
  className?: string
  maxDpr?: number
  label?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const sizeRef = useRef({ w: 0, h: 0 })

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ro = new ResizeObserver(([entry]) => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr)
      const w = Math.max(1, Math.round(entry.contentRect.width * dpr))
      const h = Math.max(1, Math.round(entry.contentRect.height * dpr))
      if (w !== sizeRef.current.w || h !== sizeRef.current.h) {
        sizeRef.current = { w, h }
        canvas.width = w
        canvas.height = h
        draw()
      }
    })
    ro.observe(canvas)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const draw = () => {
    const canvas = ref.current
    if (!canvas || !canvas.width) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    try {
      renderFrame(ctx, params, progress)
    } catch {
      ctx.fillStyle = '#EFE9DF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }

  useEffect(draw, [params.seed, params.film, params.peeks, params.fogged, params.hour, params.weather, progress])

  return <canvas ref={ref} role="img" aria-label={label ?? 'Проявленный кадр'} className={`block w-full aspect-[4/5] ${className}`} />
}
