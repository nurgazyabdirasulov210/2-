/** «Проявка» wordmark: safelight dot + display serif. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span aria-hidden className="relative grid size-3 place-items-center">
        <span className="absolute inset-0 rounded-full bg-safelight opacity-60 blur-[5px]" />
        <span className="relative size-2 rounded-full bg-safelight" />
      </span>
      <span className="font-display text-[1.6rem] leading-none font-medium tracking-[-0.01em]">
        Прояв<em className="font-normal">ка</em>
      </span>
    </span>
  )
}
