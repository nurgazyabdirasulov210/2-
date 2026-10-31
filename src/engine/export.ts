// High-resolution print export: frame on a cream darkroom-print border with a caption.
import type { FrameParams } from '../types'
import { createSurface, type Surface } from './canvas'
import { FILM_IMPLS } from './films'
import { buildFrame } from './pipeline'
import { hash2 } from './rng'

async function ensureFonts(px: number): Promise<void> {
  try {
    const fonts = (globalThis as unknown as { document?: Document }).document?.fonts
    if (!fonts) return
    await Promise.race([
      Promise.all([
        fonts.load(`${px}px "Cormorant Garamond"`),
        fonts.load(`${Math.round(px / 2.6)}px "JetBrains Mono"`),
      ]),
      new Promise((r) => setTimeout(r, 1500)),
    ])
  } catch {
    /* fonts are optional */
  }
}

function toBlob(s: Surface): Promise<Blob> {
  const c = s.canvas
  if ('convertToBlob' in c) return c.convertToBlob({ type: 'image/png' })
  return new Promise((resolve, reject) =>
    (c as HTMLCanvasElement).toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  )
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text
  let t = text
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1)
  return t.trimEnd() + '…'
}

/** Export frame as PNG Blob in a print-style white border with caption. */
export async function exportFramePNG(
  params: FrameParams,
  caption: { title: string; subtitle: string },
  size = 1600,
): Promise<Blob> {
  const iw = Math.max(200, Math.round(size))
  const ih = Math.round(iw * 1.25)
  const m = Math.round(iw * 0.07)
  const bottom = Math.round(iw * 0.24)
  const W = iw + m * 2
  const H = ih + m + bottom
  const titlePx = Math.round(iw * 0.052)
  await ensureFonts(titlePx)

  const frame = buildFrame(params, iw, ih)
  const img = createSurface(iw, ih)
  const id = img.ctx.createImageData(iw, ih)
  id.data.set(frame.data)
  img.ctx.putImageData(id, 0, 0)

  const out = createSurface(W, H)
  const ctx = out.ctx
  // paper: warm cream with faint fibre texture
  ctx.fillStyle = '#f4efe6'
  ctx.fillRect(0, 0, W, H)
  const tex = ctx.getImageData(0, 0, W, H)
  const d = tex.data
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const k = (y * W + x) * 4
      // coarse fibre streaks only — per-pixel noise on the border made the PNG incompressible (+~3 MB)
      const n = (hash2(x >> 3, y >> 1, 77) - 0.5) * 4
      d[k] += n; d[k + 1] += n; d[k + 2] += n * 0.9
    }
  }
  ctx.putImageData(tex, 0, 0)
  // image with a hairline shadow as if slightly embossed
  ctx.fillStyle = 'rgba(60,40,20,0.12)'
  ctx.fillRect(m - 1, m - 1, iw + 2, ih + 2)
  ctx.drawImage(img.canvas, m, m)

  // caption
  const ink = '#2a2420'
  const tx = m
  const maxW = iw * 0.72
  ctx.fillStyle = ink
  ctx.textBaseline = 'alphabetic'
  ctx.font = `${titlePx}px "Cormorant Garamond", "Iowan Old Style", Georgia, serif`
  const title = caption.title?.trim() || FILM_IMPLS[params.film]?.meta.name || ''
  ctx.fillText(fitText(ctx, title, maxW), tx, m + ih + bottom * 0.46)
  const monoPx = Math.round(iw * 0.017)
  ctx.font = `${monoPx}px "JetBrains Mono", ui-monospace, Menlo, monospace`
  ctx.fillStyle = 'rgba(42,36,32,0.72)'
  ctx.fillText(fitText(ctx, caption.subtitle ?? '', maxW), tx, m + ih + bottom * 0.46 + monoPx * 2.2)
  // film edge marking on the right
  const meta = FILM_IMPLS[params.film]?.meta
  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(42,36,32,0.55)'
  ctx.fillText(`${meta?.short ?? ''}  ·  #${(params.seed >>> 0).toString(16).slice(-6).toUpperCase()}`, m + iw, m + ih + bottom * 0.46 + monoPx * 2.2)
  if (params.fogged || params.peeks > 0) {
    ctx.fillText(params.fogged ? 'ЗАСВЕЧЕН' : `ЗАСВЕТЫ ×${params.peeks}`, m + iw, m + ih + bottom * 0.46)
  }
  ctx.textAlign = 'left'
  return toBlob(out)
}
