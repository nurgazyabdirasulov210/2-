import { useEffect, useRef } from 'react'
import { renderFrame } from '../../engine'
import type { FrameParams } from '../../types'

export const LOUPE_ZOOM = 2.6
const LOUPE_SIZE = 132

// Hi-res renders cached per frame key (the engine is deterministic).
const cache = new Map<string, HTMLCanvasElement>()
function hiRes(key: string, params: FrameParams, w: number, h: number): HTMLCanvasElement {
  const hit = cache.get(key)
  if (hit && hit.width === w) return hit
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (ctx) {
    try {
      renderFrame(ctx, params, 1)
    } catch {
      ctx.fillStyle = '#EFE9DF'
      ctx.fillRect(0, 0, w, h)
    }
  }
  if (cache.size > 40) cache.delete(cache.keys().next().value as string)
  cache.set(key, c)
  return c
}

/** Magnifier that follows the pointer over a frame. Coordinates are relative to the frame box. */
export function Loupe({
  frameKey,
  params,
  box,
  x,
  y,
}: {
  frameKey: string
  params: FrameParams
  box: { w: number; h: number }
  x: number
  y: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const W = Math.round(box.w * LOUPE_ZOOM)
  const H = Math.round(box.h * LOUPE_ZOOM)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const src = hiRes(frameKey, params, Math.round(W * dpr), Math.round(H * dpr))
    c.width = src.width
    c.height = src.height
    c.getContext('2d')?.drawImage(src, 0, 0)
  }, [frameKey, params, W, H])

  const R = LOUPE_SIZE / 2
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-30 overflow-hidden rounded-full"
      style={{
        width: LOUPE_SIZE,
        height: LOUPE_SIZE,
        left: x - R,
        top: y - R,
        boxShadow:
          '0 0 0 2px rgba(20,18,16,.9), 0 0 0 4px rgba(214,208,196,.55), 0 0 0 5px rgba(20,18,16,.6), 0 18px 40px -8px rgba(0,0,0,.75)',
      }}
    >
      <canvas
        ref={ref}
        className="absolute left-0 top-0 max-w-none"
        style={{ width: W, height: H, transform: `translate(${R - x * LOUPE_ZOOM}px, ${R - y * LOUPE_ZOOM}px)` }}
      />
      {/* glass: soft vignette + specular highlight */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 32% 26%, rgba(255,255,255,.28), rgba(255,255,255,0) 32%), radial-gradient(circle at 50% 50%, transparent 58%, rgba(0,0,0,.45) 100%)',
        }}
      />
    </div>
  )
}
