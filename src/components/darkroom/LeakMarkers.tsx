import { pluralRu } from '../../lib/format'

/** Peeks shown as tiny light-leak flares (max 8 drawn). */
export function LeakMarkers({ count, tone = 'warm' }: { count: number; tone?: 'warm' | 'red' }) {
  const shown = Math.min(count, 8)
  const core = tone === 'warm' ? '#fff1d6' : '#ffb3a5'
  const halo = tone === 'warm' ? 'rgba(255,170,90,.75)' : 'rgba(255,90,70,.6)'
  const label = `${count} ${pluralRu(count, ['подглядывание', 'подглядывания', 'подглядываний'])} — ${pluralRu(count, ['засвет', 'засвета', 'засветов'])} на кадре`
  return (
    <span className="inline-flex items-center gap-1.5" role="img" aria-label={label} title={label}>
      {Array.from({ length: shown }, (_, i) => (
        <span
          key={i}
          className="block h-2 w-2 rounded-full"
          style={{
            background: `radial-gradient(circle, ${core} 0 30%, ${halo} 55%, transparent 72%)`,
            boxShadow: `0 0 10px 2px ${halo}`,
            transform: `scale(${0.85 + ((i * 37) % 30) / 100}) rotate(${i * 40}deg)`,
          }}
        />
      ))}
      {count > shown && <span className="font-mono text-[10px] opacity-70">+{count - shown}</span>}
    </span>
  )
}
