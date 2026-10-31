// Store PUBLIC CONTRACT. Implemented in src/store/index.ts as a zustand hook `useStudio`
// with persist (localStorage key "proyavka:v1"). UI agents code against this interface.
import type { ActiveSession, Frame, FilmId, SessionPhase, Settings } from '../types'

export interface StudioState {
  settings: Settings
  frames: Frame[]                    // newest last
  session: ActiveSession | null
  phase: SessionPhase                // derived-but-stored for UI
  lastFinishedFrameId: string | null // for the reveal screen

  // --- session lifecycle ---
  startSession(opts: { film: FilmId; durationMs: number; intention: string }): Promise<void> // fetches weather if enabled (non-blocking, timeout 4s)
  /** Called by visibility watcher when user returns to tab before completion. */
  openDoor(): void
  /** User leaves again / presses "close the door" within grace => resume developing. peeks++ */
  closeDoor(): void
  /** User gives up: saves a fogged frame and ends the session. */
  abortSession(): Frame | null
  /** Called when developedMs >= durationMs: saves frame, phase='done'. */
  completeSession(): Frame | null
  /** Back to idle after reveal screen. */
  dismissResult(): void

  // --- album ---
  toggleFavorite(id: string): void
  deleteFrame(id: string): void
  updateSettings(patch: Partial<Settings>): void
  importData(json: string): boolean
  exportData(): string
  resetAll(): void
}

/** Pure helpers exported from src/store/index.ts */
export interface SessionMath {
  /** developedMs including the currently running stretch at `now`. */
  developedAt(session: ActiveSession, now: number): number
  /** 0..1 */
  progressAt(session: ActiveSession, now: number): number
}
