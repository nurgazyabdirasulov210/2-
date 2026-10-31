/** Wooden clothespin, front view, in SVG. */
export function Clothespin({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 72" className={className} aria-hidden>
      <defs>
        <linearGradient id="cp-wood" x1="0" x2="1">
          <stop offset="0" stopColor="#8a5a33" />
          <stop offset=".35" stopColor="#d9a874" />
          <stop offset=".6" stopColor="#c48e5a" />
          <stop offset="1" stopColor="#7a4b28" />
        </linearGradient>
        <linearGradient id="cp-metal" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e7e9ee" />
          <stop offset=".5" stopColor="#8d929c" />
          <stop offset="1" stopColor="#c9ccd3" />
        </linearGradient>
      </defs>
      {/* back prong */}
      <rect x="5.5" y="1" width="17" height="70" rx="3" fill="#6b4122" />
      {/* front prong */}
      <path d="M5 2.5c0-1 .8-1.5 1.8-1.5h14.4c1 0 1.8.5 1.8 1.5V22l-1.4 3v42c0 2.2-1.6 4-3.6 4H10c-2 0-3.6-1.8-3.6-4V25L5 22z" fill="url(#cp-wood)" />
      {/* grain */}
      <path d="M11 6v14M17 8v12M12 34v30M16.5 30v34" stroke="#7b4c27" strokeOpacity=".35" strokeWidth=".6" fill="none" />
      {/* notch */}
      <path d="M6.4 25h15.2" stroke="#5a361b" strokeOpacity=".6" strokeWidth=".8" />
      {/* spring */}
      <rect x="3" y="26" width="22" height="7" rx="2.5" fill="url(#cp-metal)" />
      <path d="M6 26.5v6M9.5 26.5v6M13 26.5v6M16.5 26.5v6M20 26.5v6" stroke="#5c6069" strokeWidth=".7" />
      {/* highlight */}
      <path d="M8.5 36v28" stroke="#fff" strokeOpacity=".25" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
