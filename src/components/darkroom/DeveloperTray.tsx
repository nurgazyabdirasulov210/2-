import { FrameCanvas } from '../FrameCanvas'
import type { FrameParams } from '../../types'

/**
 * A developer tray seen from above: dark plastic tray, a shallow layer of liquid with slow ripples,
 * and the print lying in it — rendered under a red safelight (monochrome red).
 * `light` 0..1 washes the print with white (door-open: light falling on the paper).
 */
export function DeveloperTray({
  params,
  progress,
  light = 0,
  safelight = true,
  className = '',
}: {
  params: FrameParams
  progress: number
  light?: number
  safelight?: boolean
  className?: string
}) {
  return (
    <div className={`relative aspect-[5/6] ${className}`}>
      {/* tray body */}
      <div
        className="absolute inset-0 rounded-[26px]"
        style={{
          background: 'linear-gradient(160deg, #2a1312 0%, #160909 45%, #0c0505 100%)',
          boxShadow:
            '0 40px 80px -30px rgba(0,0,0,.9), 0 0 0 1px rgba(255,110,90,.10), inset 0 1px 0 rgba(255,140,120,.18), inset 0 -2px 6px rgba(0,0,0,.6)',
        }}
      />
      {/* tray ribs (bottom texture) */}
      <div
        className="absolute inset-[14px] overflow-hidden rounded-[16px]"
        style={{
          background:
            'repeating-linear-gradient(90deg, rgba(255,90,70,.05) 0 2px, transparent 2px 22px), radial-gradient(120% 90% at 50% 30%, #2b0f0d, #120606 70%)',
          boxShadow: 'inset 0 10px 24px rgba(0,0,0,.7), inset 0 0 0 1px rgba(0,0,0,.5)',
        }}
      >
        {/* liquid + print, gently agitated */}
        <div className="dr-agitate absolute inset-0">
          {/* print */}
          <div className="absolute left-[13%] right-[13%] top-[11%] rotate-[-1.4deg]">
            <div className="relative overflow-hidden rounded-[2px] bg-paper shadow-[0_6px_18px_rgba(0,0,0,.55)]">
              <FrameCanvas
                params={params}
                progress={progress}
                maxDpr={1.5}
                label="Кадр в проявителе"
                className={safelight ? '[filter:grayscale(1)_contrast(1.15)_brightness(1.12)]' : ''}
              />
              {/* safelight tint: everything turns red/black */}
              {safelight && (
                <div className="pointer-events-none absolute inset-0 bg-[#e0453a] mix-blend-multiply" style={{ opacity: 0.92 }} />
              )}
              {/* light falling on the paper */}
              <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-700"
                style={{
                  opacity: light,
                  background: 'linear-gradient(115deg, rgba(255,236,205,.95), rgba(255,214,170,.55) 45%, rgba(255,200,150,.25))',
                  mixBlendMode: 'screen',
                }}
              />
            </div>
          </div>
          {/* liquid surface: tint, sheen and ripples above the print */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(90,10,6,.08), rgba(30,0,0,.16))' }} />
          <div className="absolute inset-0 overflow-hidden">
            <div className="dr-sheen" />
            <span className="dr-ripple" style={{ left: '30%', top: '36%', animationDelay: '0s' }} />
            <span className="dr-ripple" style={{ left: '68%', top: '62%', animationDelay: '3s' }} />
            <span className="dr-ripple" style={{ left: '44%', top: '80%', animationDelay: '6s' }} />
          </div>
          {/* meniscus at the edge */}
          <div className="absolute inset-0 rounded-[16px]" style={{ boxShadow: 'inset 0 0 0 2px rgba(255,120,100,.08), inset 0 0 30px rgba(255,80,60,.06)' }} />
        </div>
      </div>
      {/* pouring lip */}
      <div className="absolute left-1/2 top-[3px] h-[6px] w-[22%] -translate-x-1/2 rounded-full bg-[rgba(255,130,110,.10)]" />
    </div>
  )
}
