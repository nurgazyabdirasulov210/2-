// Darkroom watcher: turns Page Visibility + user (in)activity into store transitions.
//
// Rules (phase → trigger → action):
//  developing  · tab becomes visible            → openDoor()        (unless already complete → completeSession())
//  developing  · interaction while visible       → openDoor()        (ignored for SETTLE_MS after lights go off)
//  door-open   · tab hidden again                → closeDoor()       (development resumes; peeks++ only if the
//                                                                     door stayed open longer than graceSeconds)
//  door-open   · visible but idle for IDLE_MS    → closeDoor()       (user put the phone down without locking it)
//  door-open   · grace elapsed                   → nothing (door-open just pauses development; no auto-abort)
//  Interactions inside elements marked [data-no-peek] (abort button, confirm dialog) never open the door.
//  `pageshow` only matters for back/forward-cache restores; a normal (re)load is handled once at mount.
//  any session · developedAt >= durationMs       → completeSession() (+ notification if tab hidden & enabled)
// Checked on visibilitychange, focus, pageshow, and a 1 s interval.
import { useEffect, useState } from 'react'
import type { ActiveSession, SessionPhase } from '../types'
import { developedAt, progressAt, useStudio } from '../store'
import { notifyFrameDeveloped, resetTitle, setSessionTitle } from './notify'

/** No pointer/keyboard/touch/scroll for this long while visible = "lights off", development runs. */
export const IDLE_MS = 8000
/** After lights go off (start / door closed) interactions are ignored for this long. */
export const SETTLE_MS = 3000
/** Pointer must travel this far (px, within a burst) to count as activity. */
const MOVE_THRESHOLD_PX = 32

let refCount = 0
let teardown: (() => void) | null = null
let lastActivityAt = Date.now()
let settleUntil = 0
let moveAccum = 0
let lastMoveAt = 0
let lastMoveX = 0
let lastMoveY = 0

const isVisible = () => typeof document === 'undefined' || document.visibilityState === 'visible'

/** ms since the last user interaction (pointer/keyboard/touch/scroll). */
export function idleForMs(now: number = Date.now()): number {
  return Math.max(0, now - lastActivityAt)
}

function checkComplete(now: number): boolean {
  const st = useStudio.getState()
  const s = st.session
  if (!s || (st.phase !== 'developing' && st.phase !== 'door-open')) return false
  if (developedAt(s, now) < s.durationMs) return false
  const wasHidden = !isVisible()
  const frame = st.completeSession()
  if (frame && wasHidden && st.settings.notifications) notifyFrameDeveloped(frame.number, frame.intention)
  return true
}

function updateTitle(now: number) {
  const { session, phase } = useStudio.getState()
  if (session && (phase === 'developing' || phase === 'door-open')) {
    setSessionTitle(Math.max(0, session.durationMs - developedAt(session, now)), progressAt(session, now), phase === 'door-open')
  } else {
    resetTitle()
  }
}

function tick() {
  const now = Date.now()
  if (!checkComplete(now)) {
    const st = useStudio.getState()
    if (st.phase === 'door-open' && st.session) {
      if (!isVisible()) st.closeDoor()
      else {
        const openedAt = st.session.doorOpenedAt ?? now
        if (now - Math.max(lastActivityAt, openedAt) >= IDLE_MS) st.closeDoor()
      }
    }
  }
  updateTitle(Date.now())
}

function onVisibilityChange() {
  const now = Date.now()
  if (checkComplete(now)) return updateTitle(now)
  const st = useStudio.getState()
  if (isVisible()) {
    lastActivityAt = now // returning to the tab is itself an interaction
    if (st.phase === 'developing') st.openDoor()
  } else if (st.phase === 'door-open') {
    st.closeDoor()
  }
  updateTitle(now)
}

function isNoPeekTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[data-no-peek]') != null
}

function onActivity(e?: Event) {
  const now = Date.now()
  lastActivityAt = now
  if (e && isNoPeekTarget(e.target)) return
  if (!isVisible() || now < settleUntil) return
  const st = useStudio.getState()
  if (st.phase === 'developing' && st.session) {
    if (!checkComplete(now)) st.openDoor()
  }
}

function onPointerMove(e: PointerEvent) {
  const now = Date.now()
  if (isNoPeekTarget(e.target)) {
    lastActivityAt = now
    moveAccum = 0
    return
  }
  if (now - lastMoveAt > 600) moveAccum = 0
  else moveAccum += Math.hypot(e.clientX - lastMoveX, e.clientY - lastMoveY)
  lastMoveAt = now
  lastMoveX = e.clientX
  lastMoveY = e.clientY
  if (moveAccum >= MOVE_THRESHOLD_PX) {
    moveAccum = 0
    onActivity(e)
  }
}

function onPageShow(e: PageTransitionEvent) {
  // Initial load / reload is evaluated once in install(); only bfcache restores need a re-check here.
  if (e.persisted) onVisibilityChange()
}

function install(): () => void {
  const opts: AddEventListenerOptions = { passive: true, capture: true }
  const activityEvents = ['pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'] as const
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pageshow', onPageShow)
  window.addEventListener('focus', tick)
  for (const ev of activityEvents) window.addEventListener(ev, onActivity, opts)
  window.addEventListener('pointermove', onPointerMove, opts)
  const interval = window.setInterval(tick, 1000)

  // Lights going off (start or door closed) → give the user a moment to put the device down.
  let prevPhase: SessionPhase = useStudio.getState().phase
  const unsub = useStudio.subscribe((st) => {
    if (st.phase === 'developing' && prevPhase !== 'developing') {
      const now = Date.now()
      settleUntil = now + SETTLE_MS
      lastActivityAt = now
      moveAccum = 0
    }
    prevPhase = st.phase
    updateTitle(Date.now())
  })

  // Mount (e.g. after reload) while developing and looking at the page = a peek.
  const now = Date.now()
  const st = useStudio.getState()
  if (!checkComplete(now) && st.phase === 'developing' && st.session && isVisible()) {
    const started = st.session.stretchStartedAt ?? now
    if (now - started > SETTLE_MS) st.openDoor()
    else settleUntil = started + SETTLE_MS
  }
  updateTitle(now)

  return () => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('pageshow', onPageShow)
    window.removeEventListener('focus', tick)
    for (const ev of activityEvents) window.removeEventListener(ev, onActivity, opts)
    window.removeEventListener('pointermove', onPointerMove, opts)
    window.clearInterval(interval)
    unsub()
    resetTitle()
  }
}

/**
 * Mount once in App root (and optionally in the darkroom page — mounts are ref-counted,
 * listeners are installed only once).
 */
export function useDarkroomWatcher(): void {
  useEffect(() => {
    if (refCount++ === 0) teardown = install()
    return () => {
      if (--refCount === 0 && teardown) {
        teardown()
        teardown = null
      }
    }
  }, [])
}

export interface SessionClock {
  phase: SessionPhase
  session: ActiveSession | null
  /** 0..1 */
  progress: number
  developedMs: number
  remainingMs: number
  /** ms since door opened (0 unless phase === 'door-open'). */
  doorOpenMs: number
  /** ms left of settings.graceSeconds since the door opened (0 when elapsed / not open). */
  graceLeftMs: number
  /** ms until the idle auto-close turns the lights off again (door-open & visible), else 0. */
  autoCloseInMs: number
}

/** Live session readout for UI, re-rendering every 250 ms while a session exists. */
export function useSessionClock(): SessionClock {
  const session = useStudio((s) => s.session)
  const phase = useStudio((s) => s.phase)
  const graceSeconds = useStudio((s) => s.settings.graceSeconds)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!session) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [session])

  if (!session) {
    return { phase, session, progress: phase === 'done' ? 1 : 0, developedMs: 0, remainingMs: 0, doorOpenMs: 0, graceLeftMs: 0, autoCloseInMs: 0 }
  }
  const t = Math.max(now, session.stretchStartedAt ?? 0)
  const developedMs = Math.min(session.durationMs, developedAt(session, t))
  const doorOpenMs = phase === 'door-open' && session.doorOpenedAt != null ? Math.max(0, t - session.doorOpenedAt) : 0
  const autoCloseInMs =
    phase === 'door-open'
      ? Math.max(0, IDLE_MS - (t - Math.max(lastActivityAt, session.doorOpenedAt ?? t)))
      : 0
  return {
    phase,
    session,
    progress: progressAt(session, t),
    developedMs,
    remainingMs: Math.max(0, session.durationMs - developedMs),
    doorOpenMs,
    graceLeftMs: phase === 'door-open' ? Math.max(0, graceSeconds * 1000 - doorOpenMs) : 0,
    autoCloseInMs,
  }
}
