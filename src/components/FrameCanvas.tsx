import { useEffect, useRef } from 'react'
import { renderFrame } from '../engine'
import type { FrameParams } from '../types'

// ---------------------------------------------------------------- render queue
// One rAF loop drains pending draws within a ~10 ms budget per frame (at least one draw per frame).
// A Set dedupes repeated requests from the same canvas; the latest params are read at draw time.
const queue = new Set<() => void>()
let loop = 0
const BUDGET_MS = 10

function drain() {
  loop = 0
  const t0 = performance.now()
  for (const job of queue) {
    queue.delete(job)
    job()
    if (performance.now() - t0 > BUDGET_MS) break
  }
  if (queue.size) loop = requestAnimationFrame(drain)
}

function enqueue(job: () => void) {
  queue.add(job)
  if (!loop) loop = requestAnimationFrame(drain)
}

/**
 * Shared canvas that renders a generative frame at the given development progress.
 * Sized by its container (CSS), renders at devicePixelRatio (capped at 2), aspect 4:5 by default.
 * Redraws only when params/progress change or the canvas is resized (at most once per animation frame).
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
  const latest = useRef({ params, progress })

  // Redraws go through a shared, time-sliced queue (see below) so a page with many frames
  // never blocks the main thread with one giant task.
  const scheduleDraw = useRef(() => {
    enqueue(job.current)
  }).current
  const job = useRef(() => {
    const canvas = ref.current
    if (!canvas || !canvas.width || !canvas.isConnected) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    try {
      renderFrame(ctx, latest.current.params, latest.current.progress)
    } catch {
      ctx.fillStyle = '#EFE9DF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  })

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ro = new ResizeObserver(([entry]) => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr)
      const w = Math.max(1, Math.round(entry.contentRect.width * dpr))
      const h = Math.max(1, Math.round(entry.contentRect.height * dpr))
      if (w !== canvas.width || h !== canvas.height) {
        canvas.width = w
        canvas.height = h
        scheduleDraw()
      }
    })
    ro.observe(canvas)
    const j = job.current
    return () => {
      ro.disconnect()
      queue.delete(j)
    }
  }, [maxDpr, scheduleDraw])

  const { seed, film, peeks, fogged, hour, weather } = params
  useEffect(() => {
    latest.current = { params, progress }
    scheduleDraw()
    // params identity is irrelevant — only its values affect the image
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, film, peeks, fogged, hour, weather, progress, scheduleDraw])

  return <canvas ref={ref} role="img" aria-label={label ?? 'Проявленный кадр'} className={`block w-full aspect-[4/5] ${className}`} />
}
