import { motion, useReducedMotion } from 'framer-motion'

/**
 * The room under a safelight: near-black with a dim red bulb glow from above, slowly breathing.
 * `intensity` 0..1 lets the lights-off (idle) view dim it further.
 */
export function Safelight({ intensity = 1 }: { intensity?: number }) {
  const reduce = useReducedMotion()
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-[#050304]">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: reduce ? intensity : [0, 0.55, 0.15, 0.85, 0.6, intensity] }}
        transition={reduce ? { duration: 0.2 } : { duration: 2.4, times: [0, 0.18, 0.28, 0.5, 0.62, 1], ease: 'easeOut' }}
      >
        {/* bulb glow (top) */}
        <div
          className="dr-breathe absolute left-1/2 top-[-30%] h-[95vmax] w-[95vmax] -translate-x-1/2 rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(224,69,58,.30), rgba(160,30,24,.12) 45%, transparent 75%)' }}
        />
        {/* pool of light on the bench, where the tray sits */}
        <div
          className="absolute left-1/2 top-[44%] h-[70vmin] w-[110vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(224,69,58,.16), transparent 70%)' }}
        />
        {/* bulb itself */}
        <div className="absolute left-1/2 top-3 h-1.5 w-16 -translate-x-1/2 rounded-full bg-[#ff6a55] opacity-80 blur-[2px] shadow-[0_0_30px_10px_rgba(224,69,58,.55)]" />
      </motion.div>
      {/* vignette */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 45%, transparent 40%, rgba(0,0,0,.75) 100%)' }} />
    </div>
  )
}
