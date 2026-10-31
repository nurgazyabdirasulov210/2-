import { motion, useReducedMotion } from 'framer-motion'

/** The big ritual button: a red safelight bulb that "switches" the room off. */
export function SafelightButton({ onClick, busy }: { onClick: () => void; busy?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={busy}
      whileHover={reduce ? undefined : { y: -1 }}
      whileTap={reduce ? undefined : { scale: 0.975 }}
      className={
        'group relative isolate flex h-16 w-full items-center justify-center gap-3 overflow-hidden rounded-full ' +
        'bg-safelight text-white shadow-[0_0_0_1px_rgba(255,120,100,.45),0_18px_50px_-10px_var(--safelight-glow),0_0_80px_-20px_var(--safelight)] ' +
        'transition-[box-shadow,filter] duration-300 ease-out-quint hover:brightness-110 ' +
        'hover:shadow-[0_0_0_1px_rgba(255,140,120,.6),0_22px_60px_-8px_rgba(224,69,58,.6),0_0_120px_-10px_var(--safelight)] ' +
        'disabled:opacity-70'
      }
    >
      {/* inner glass highlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-full"
        style={{
          background:
            'radial-gradient(120% 140% at 50% -40%, rgba(255,220,200,.45), transparent 55%), linear-gradient(180deg, #ec5547, #b9271e)',
        }}
      />
      {/* sweeping sheen on hover */}
      {!reduce && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/20 opacity-0 blur-md transition-[transform,opacity] duration-700 ease-out-quint group-hover:translate-x-[400%] group-hover:opacity-100"
        />
      )}
      <span aria-hidden className="relative flex h-3 w-3 items-center justify-center">
        <span className="absolute h-3 w-3 rounded-full bg-[#ffd2c4] shadow-[0_0_12px_4px_rgba(255,190,170,.8)]" />
        {!reduce && <span className="absolute h-3 w-3 animate-ping rounded-full bg-[#ffd2c4]/60" />}
      </span>
      <span className="font-display text-[1.6rem] font-medium italic leading-none tracking-[-0.01em]">
        {busy ? 'Гашу свет…' : 'Погасить свет'}
      </span>
    </motion.button>
  )
}
