import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useStudio } from '../store'
import { useDarkroomWatcher } from '../lib/visibility'
import { sound } from '../lib/sound'
import { ConfirmDialog } from '../components/ui/Dialog'
import { Setup } from '../components/darkroom/Setup'
import { DevelopingRoom } from '../components/darkroom/DevelopingRoom'
import { DoorOpen } from '../components/darkroom/DoorOpen'
import { RevealLine } from '../components/darkroom/RevealLine'
import type { SessionPhase } from '../types'
import '../components/darkroom/darkroom.css'

/** Ambient sound + cues on phase transitions (sound module itself respects settings.sound). */
function useDarkroomSound(phase: SessionPhase) {
  const prev = useRef<SessionPhase | null>(null)
  useEffect(() => {
    const from = prev.current
    prev.current = phase
    if (from === phase) return
    if (phase === 'developing') {
      if (from === 'idle') sound.playCue('lights-off')
      sound.start()
    } else if (phase === 'door-open') {
      sound.playCue('door-open')
      sound.stop()
    } else if (phase === 'done') {
      sound.stop()
      if (from === 'developing' || from === 'door-open') sound.playCue('reveal')
    } else {
      sound.stop()
    }
  }, [phase])
  useEffect(() => () => sound.stop(), [])
}

export default function Darkroom() {
  useDarkroomWatcher()
  const reduce = useReducedMotion()
  const phase = useStudio((s) => s.phase)
  const sessionId = useStudio((s) => s.session?.id ?? null)
  const hasSession = sessionId != null
  const abortSession = useStudio((s) => s.abortSession)
  const frames = useStudio((s) => s.frames)
  const lastId = useStudio((s) => s.lastFinishedFrameId)
  // the confirm is bound to the session it was asked for, so it can't leak into the next one
  const [confirmFor, setConfirmFor] = useState<string | null>(null)

  useDarkroomSound(phase)

  const lastFrame = phase === 'done' && lastId ? frames.find((f) => f.id === lastId) ?? null : null
  const nextNumber = frames.reduce((m, f) => Math.max(m, f.number), 0) + 1

  type View = 'setup' | 'developing' | 'door' | 'reveal'
  const view: View =
    phase === 'developing' && hasSession
      ? 'developing'
      : phase === 'door-open' && hasSession
        ? 'door'
        : lastFrame
          ? 'reveal'
          : 'setup'

  // Lock page scroll while the room is dark.
  useEffect(() => {
    if (view !== 'developing' && view !== 'door') return
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prev
    }
  }, [view])

  const take = () => {
    setConfirmFor(null)
    abortSession()
  }

  const room =
    view === 'developing' ? (
      <DevelopingRoom key="developing" frameNumber={nextNumber} onRequestAbort={() => setConfirmFor(sessionId)} />
    ) : view === 'door' ? (
      <DoorOpen key="door" onTakeAsIs={take} />
    ) : null

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        {view === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, filter: 'brightness(0.2)', transition: { duration: 0.45, ease: [0.55, 0, 1, 0.45] } }}
          >
            <Setup />
          </motion.div>
        )}
        {view === 'reveal' && lastFrame && <RevealLine key={`reveal-${lastFrame.id}`} frame={lastFrame} />}
      </AnimatePresence>

      {/* The dark room lives in a portal so `position: fixed` is never trapped by transformed ancestors. */}
      {typeof document !== 'undefined' && createPortal(<AnimatePresence>{room}</AnimatePresence>, document.body)}

      <ConfirmDialog
        open={confirmFor != null && confirmFor === sessionId}
        title="Прервать проявку?"
        description="Кадр сохранится как есть — засвеченным. Его всё равно можно будет найти в контактном листе."
        confirmLabel="Забрать как есть"
        cancelLabel="Продолжить проявку"
        tone="danger"
        onConfirm={take}
        onCancel={() => setConfirmFor(null)}
      />
    </>
  )
}
