import { motion } from 'framer-motion'
import { useRef, useState, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Frame } from '../../types'
import { formatDate } from '../../lib/format'
import { GreaseCircle } from './GreaseCircle'
import { LazyFrame } from './LazyFrame'
import { Loupe } from './Loupe'
import { edgeNumber, frameParams, getFilm } from './films'

export const STRIP_BASE = '#110d0a'
export const EDGE_INK = '#E9A13B'

// Rounded perforation tile, used as a CSS mask so the holes are "lit" from behind.
const PERF_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='9'%3E%3Crect x='3.5' y='0.5' width='7' height='8' rx='1.6' fill='white'/%3E%3C/svg%3E\")"

export function Perforations({ className = '', lit = 0.14 }: { className?: string; lit?: number }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-1 h-[9px] ${className}`}
      style={{
        background: `rgba(239,233,223,${lit})`,
        WebkitMaskImage: PERF_MASK,
        maskImage: PERF_MASK,
        WebkitMaskRepeat: 'repeat-x',
        maskRepeat: 'repeat-x',
        WebkitMaskSize: '14px 9px',
        maskSize: '14px 9px',
      }}
    />
  )
}

/** One horizontal strip of film holding up to `perStrip` frames. */
export function FilmStrip({
  frames,
  perStrip,
  tilt = 0,
  demo = false,
}: {
  frames: Frame[]
  perStrip: number
  tilt?: number
  demo?: boolean
}) {
  const k = frames.length
  return (
    <div
      className="relative overflow-visible rounded-[3px] shadow-md"
      style={{
        width: `${(k / perStrip) * 100}%`,
        minWidth: k < perStrip ? 'min(100%, 9rem)' : undefined,
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        background: `linear-gradient(180deg, #17120e 0%, ${STRIP_BASE} 18%, ${STRIP_BASE} 82%, #17120e 100%)`,
      }}
    >
      <Perforations className="top-[15px]" />
      <Perforations className="bottom-[15px]" />
      <div className="grid" style={{ gridTemplateColumns: `repeat(${k}, minmax(0, 1fr))` }}>
        {frames.map((f) => (
          <StripCell key={f.id} frame={f} demo={demo} />
        ))}
      </div>
    </div>
  )
}

function StripCell({ frame, demo }: { frame: Frame; demo: boolean }) {
  const film = getFilm(frame.film)
  const n = edgeNumber(frame.number)
  const params = frameParams(frame)
  const boxRef = useRef<HTMLDivElement>(null)
  const [loupe, setLoupe] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const r = boxRef.current?.getBoundingClientRect()
    if (!r) return
    setLoupe({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height })
  }

  const label = `Кадр ${frame.number}, ${film.name}, ${formatDate(frame.startedAt)}${frame.intention ? `, «${frame.intention}»` : ''}${frame.fogged ? ', засвечен' : ''}${frame.favorite ? ', отмечен' : ''}`

  return (
    <div className="relative px-[5px] pb-[30px] pt-[30px] sm:px-[7px]">
      {/* edge print, outside the perforations */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-2 right-1 top-[1px] flex items-center gap-2 overflow-hidden whitespace-nowrap font-mono text-[9px] uppercase leading-[14px] tracking-[0.14em] sm:text-[10px]"
        style={{ color: EDGE_INK, opacity: 0.82 }}
      >
        <span>{film.short}</span>
        <span className="opacity-70 max-sm:hidden">▸ {n}</span>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[1px] left-2 right-1 flex items-center justify-between overflow-hidden whitespace-nowrap font-mono text-[9px] leading-[14px] tracking-[0.12em] sm:text-[10px]"
        style={{ color: EDGE_INK, opacity: 0.82 }}
      >
        <span>
          {n}
          <span className="opacity-60">▸</span>
        </span>
        <span className="opacity-70">{n}A</span>
      </div>

      <Link
        to={`/album/${frame.id}${demo ? '?demo=1' : ''}`}
        aria-label={label}
        className="group relative block rounded-[1px] outline-offset-4"
        onPointerMove={onMove}
        onPointerLeave={() => setLoupe(null)}
      >
        <motion.div layoutId={`frame-${frame.id}`} ref={boxRef} className="relative">
          <LazyFrame params={params} label={label} />
          {/* hover caption */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-1.5 pt-6 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
            <p className="truncate font-mono text-[10px] tracking-[0.06em] text-[#EFE9DF]/90">{formatDate(frame.startedAt)}</p>
          </div>
        </motion.div>
        <GreaseCircle seed={frame.seed} show={frame.favorite} bleed="-10%" />
        {loupe && <Loupe frameKey={`${frame.id}`} params={params} box={{ w: loupe.w, h: loupe.h }} x={loupe.x} y={loupe.y} />}
      </Link>
    </div>
  )
}
