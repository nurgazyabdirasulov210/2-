// Studio store — implements StudioState from ./contract.ts.
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ActiveSession, FilmId, Frame, SessionPhase, Settings, Weather } from '../types'
import type { SessionMath, StudioState } from './contract'
import { getCurrentWeather } from '../lib/weather'

export type { StudioState, SessionMath } from './contract'

export const STORAGE_KEY = 'proyavka:v1'
export const STORE_VERSION = 1
/** Max time startSession waits for weather before giving up (the session itself starts immediately). */
const WEATHER_WAIT_MS = 12000

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  weather: false,
  notifications: false,
  graceSeconds: 5,
  name: '',
}

const FILM_IDS: readonly FilmId[] = ['portra', 'ilford', 'cyan', 'cinestill', 'polaroid', 'aurora']

// ---------------------------------------------------------------- pure helpers

/** developedMs including the currently running stretch at `now`. */
export function developedAt(session: ActiveSession, now: number): number {
  const running = session.stretchStartedAt != null ? Math.max(0, now - session.stretchStartedAt) : 0
  return Math.max(0, session.developedMs + running)
}

/** 0..1 */
export function progressAt(session: ActiveSession, now: number): number {
  if (!(session.durationMs > 0)) return 1
  return Math.min(1, Math.max(0, developedAt(session, now) / session.durationMs))
}

/** Remaining ms of development at `now` (≥ 0). */
export function remainingAt(session: ActiveSession, now: number): number {
  return Math.max(0, session.durationMs - developedAt(session, now))
}

export const sessionMath: SessionMath = { developedAt, progressAt }

export function randomSeed(): number {
  try {
    const a = new Uint32Array(1)
    crypto.getRandomValues(a)
    return a[0]
  } catch {
    return Math.floor(Math.random() * 0x100000000) >>> 0
  }
}

export function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  } catch {
    /* insecure context */
  }
  const hex = (n: number) =>
    Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${'89ab'[Math.floor(Math.random() * 4)]}${hex(3)}-${hex(12)}`
}

function nextFrameNumber(frames: readonly Frame[]): number {
  let max = 0
  for (const f of frames) if (f.number > max) max = f.number
  return max + 1
}

function frameFromSession(s: ActiveSession, frames: readonly Frame[], now: number, fogged: boolean): Frame {
  return {
    id: newId(),
    number: nextFrameNumber(frames),
    film: s.film,
    intention: s.intention,
    seed: s.seed,
    weather: s.weather,
    hour: s.hour,
    peeks: s.peeks,
    fogged,
    durationMs: s.durationMs,
    developedMs: Math.round(Math.min(s.durationMs, developedAt(s, now))),
    startedAt: s.startedAt,
    finishedAt: now,
    favorite: false,
  }
}

// ---------------------------------------------------------------- sanitizers (import / migrate)

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isStr = (v: unknown): v is string => typeof v === 'string'

function sanitizeWeather(v: unknown): Weather | null {
  if (!isObj(v) || !isNum(v.temperature) || !isNum(v.weatherCode)) return null
  return {
    temperature: v.temperature,
    weatherCode: v.weatherCode,
    cloudCover: isNum(v.cloudCover) ? v.cloudCover : 0,
    precipitation: isNum(v.precipitation) ? v.precipitation : 0,
    isDay: v.isDay !== false,
    windSpeed: isNum(v.windSpeed) ? v.windSpeed : 0,
    label: isStr(v.label) ? v.label : '',
  }
}

function sanitizeSettings(v: unknown): Settings {
  const s = isObj(v) ? v : {}
  return {
    sound: typeof s.sound === 'boolean' ? s.sound : DEFAULT_SETTINGS.sound,
    weather: typeof s.weather === 'boolean' ? s.weather : DEFAULT_SETTINGS.weather,
    notifications: typeof s.notifications === 'boolean' ? s.notifications : DEFAULT_SETTINGS.notifications,
    graceSeconds: isNum(s.graceSeconds) && s.graceSeconds >= 0 ? s.graceSeconds : DEFAULT_SETTINGS.graceSeconds,
    name: isStr(s.name) ? s.name.slice(0, 80) : DEFAULT_SETTINGS.name,
  }
}

function sanitizeFrame(v: unknown): Frame | null {
  if (!isObj(v)) return null
  if (!isStr(v.film) || !FILM_IDS.includes(v.film as FilmId)) return null
  if (!isNum(v.seed) || !isNum(v.startedAt)) return null
  const durationMs = isNum(v.durationMs) ? Math.max(0, v.durationMs) : 0
  return {
    id: isStr(v.id) && v.id ? v.id : newId(),
    number: isNum(v.number) && v.number > 0 ? Math.floor(v.number) : 0,
    film: v.film as FilmId,
    intention: isStr(v.intention) ? v.intention : '',
    seed: v.seed >>> 0,
    weather: sanitizeWeather(v.weather),
    hour: isNum(v.hour) ? Math.min(23, Math.max(0, Math.floor(v.hour))) : new Date(v.startedAt).getHours(),
    peeks: isNum(v.peeks) ? Math.max(0, Math.floor(v.peeks)) : 0,
    fogged: v.fogged === true,
    durationMs,
    developedMs: isNum(v.developedMs) ? Math.max(0, v.developedMs) : durationMs,
    startedAt: v.startedAt,
    finishedAt: isNum(v.finishedAt) ? v.finishedAt : v.startedAt + durationMs,
    favorite: v.favorite === true,
  }
}

/** Sanitize a list of frames: drop invalid, dedupe ids, sort by number/startedAt, fill missing numbers. */
function sanitizeFrames(v: unknown): Frame[] {
  if (!Array.isArray(v)) return []
  const seen = new Set<string>()
  const out: Frame[] = []
  for (const raw of v) {
    const f = sanitizeFrame(raw)
    if (!f || seen.has(f.id)) continue
    seen.add(f.id)
    out.push(f)
  }
  out.sort((a, b) => (a.number && b.number ? a.number - b.number : a.startedAt - b.startedAt))
  let max = 0
  for (const f of out) {
    if (!f.number || f.number <= max) f.number = max + 1
    max = f.number
  }
  return out
}

function sanitizeSession(v: unknown): ActiveSession | null {
  if (!isObj(v)) return null
  if (!isStr(v.film) || !FILM_IDS.includes(v.film as FilmId)) return null
  if (!isNum(v.durationMs) || v.durationMs <= 0 || !isNum(v.startedAt)) return null
  return {
    id: isStr(v.id) ? v.id : newId(),
    film: v.film as FilmId,
    intention: isStr(v.intention) ? v.intention : '',
    durationMs: v.durationMs,
    startedAt: v.startedAt,
    developedMs: isNum(v.developedMs) ? Math.max(0, v.developedMs) : 0,
    stretchStartedAt: isNum(v.stretchStartedAt) ? v.stretchStartedAt : null,
    peeks: isNum(v.peeks) ? Math.max(0, Math.floor(v.peeks)) : 0,
    doorOpenedAt: isNum(v.doorOpenedAt) ? v.doorOpenedAt : null,
    seed: isNum(v.seed) ? v.seed >>> 0 : randomSeed(),
    weather: sanitizeWeather(v.weather),
    hour: isNum(v.hour) ? v.hour : new Date(v.startedAt).getHours(),
  }
}

type PersistedSlice = Pick<StudioState, 'settings' | 'frames' | 'session' | 'phase' | 'lastFinishedFrameId'>

function sanitizePersisted(v: unknown): PersistedSlice {
  const p = isObj(v) ? v : {}
  const frames = sanitizeFrames(p.frames)
  const session = sanitizeSession(p.session)
  let phase: SessionPhase =
    p.phase === 'developing' || p.phase === 'door-open' || p.phase === 'done' ? p.phase : 'idle'
  // keep phase consistent with session
  if (session) {
    if (phase !== 'door-open') phase = 'developing'
    if (phase === 'developing' && session.stretchStartedAt == null) {
      session.stretchStartedAt = Date.now()
      session.doorOpenedAt = null
    }
    if (phase === 'door-open' && session.stretchStartedAt != null) {
      session.developedMs = developedAt(session, Date.now())
      session.stretchStartedAt = null
      session.doorOpenedAt = session.doorOpenedAt ?? Date.now()
    }
  } else if (phase === 'developing' || phase === 'door-open') {
    phase = 'idle'
  }
  const lastId = isStr(p.lastFinishedFrameId) && frames.some((f) => f.id === p.lastFinishedFrameId)
    ? p.lastFinishedFrameId
    : null
  if (phase === 'done' && !lastId) phase = 'idle'
  return { settings: sanitizeSettings(p.settings), frames, session, phase, lastFinishedFrameId: lastId }
}

// ---------------------------------------------------------------- store

const initialSlice = (): PersistedSlice => ({
  settings: { ...DEFAULT_SETTINGS },
  frames: [],
  session: null,
  phase: 'idle',
  lastFinishedFrameId: null,
})

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => ({
      ...initialSlice(),

      async startSession({ film, durationMs, intention }) {
        const { session, settings } = get()
        if (session) return // a session is already running; UI should abort/finish it first
        const now = Date.now()
        const s: ActiveSession = {
          id: newId(),
          film,
          intention: (intention ?? '').trim().slice(0, 140),
          durationMs: Math.max(1000, Math.round(durationMs)),
          startedAt: now,
          developedMs: 0,
          stretchStartedAt: now,
          peeks: 0,
          doorOpenedAt: null,
          seed: randomSeed(),
          weather: null,
          hour: new Date(now).getHours(),
        }
        // Session starts synchronously; weather is patched in when (if) it arrives.
        set({ session: s, phase: 'developing', lastFinishedFrameId: null })
        if (!settings.weather) return
        const weather = await Promise.race([
          getCurrentWeather(),
          new Promise<null>((r) => setTimeout(() => r(null), WEATHER_WAIT_MS)),
        ])
        if (!weather) return
        const cur = get().session
        if (cur && cur.id === s.id) set({ session: { ...cur, weather } })
      },

      openDoor() {
        const { session, phase } = get()
        if (!session || phase !== 'developing') return
        const now = Date.now()
        set({
          phase: 'door-open',
          session: { ...session, developedMs: developedAt(session, now), stretchStartedAt: null, doorOpenedAt: now },
        })
      },

      closeDoor() {
        const { session, phase, settings } = get()
        if (!session || phase !== 'door-open') return
        const now = Date.now()
        // Grace: a door closed again within settings.graceSeconds leaves no light leak.
        const openFor = session.doorOpenedAt != null ? now - session.doorOpenedAt : Infinity
        const leaked = openFor > settings.graceSeconds * 1000
        set({
          phase: 'developing',
          session: { ...session, peeks: session.peeks + (leaked ? 1 : 0), stretchStartedAt: now, doorOpenedAt: null },
        })
      },

      abortSession() {
        const { session, frames } = get()
        if (!session) return null
        const frame = frameFromSession(session, frames, Date.now(), true)
        set({ frames: [...frames, frame], session: null, phase: 'done', lastFinishedFrameId: frame.id })
        return frame
      },

      completeSession() {
        const { session, frames } = get()
        if (!session) return null
        const frame = frameFromSession(session, frames, Date.now(), false)
        set({ frames: [...frames, frame], session: null, phase: 'done', lastFinishedFrameId: frame.id })
        return frame
      },

      dismissResult() {
        if (get().session) return
        set({ phase: 'idle', lastFinishedFrameId: null })
      },

      toggleFavorite(id) {
        set({ frames: get().frames.map((f) => (f.id === id ? { ...f, favorite: !f.favorite } : f)) })
      },

      deleteFrame(id) {
        const { frames, lastFinishedFrameId, phase } = get()
        const removingLast = lastFinishedFrameId === id
        set({
          frames: frames.filter((f) => f.id !== id),
          lastFinishedFrameId: removingLast ? null : lastFinishedFrameId,
          phase: removingLast && phase === 'done' ? 'idle' : phase,
        })
      },

      updateSettings(patch) {
        set({ settings: sanitizeSettings({ ...get().settings, ...patch }) })
      },

      importData(json) {
        try {
          const data: unknown = JSON.parse(json)
          if (!isObj(data) || !Array.isArray(data.frames)) return false
          const frames = sanitizeFrames(data.frames)
          if (data.frames.length > 0 && frames.length === 0) return false
          set({
            frames,
            settings: isObj(data.settings) ? sanitizeSettings(data.settings) : get().settings,
            lastFinishedFrameId: null,
            phase: get().session ? get().phase : 'idle',
          })
          return true
        } catch {
          return false
        }
      },

      exportData() {
        const { settings, frames } = get()
        return JSON.stringify(
          { app: 'proyavka', version: STORE_VERSION, exportedAt: new Date().toISOString(), settings, frames },
          null,
          2,
        )
      },

      resetAll() {
        set(initialSlice())
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): PersistedSlice => ({
        settings: s.settings,
        frames: s.frames,
        session: s.session,
        phase: s.phase,
        lastFinishedFrameId: s.lastFinishedFrameId,
      }),
      // Any older/unknown version is sanitized field-by-field into the current shape.
      migrate: (persisted) => sanitizePersisted(persisted) as unknown as StudioState,
      merge: (persisted, current) => ({ ...current, ...sanitizePersisted(persisted) }),
    },
  ),
)

/** Non-React access (e.g. from lib modules). */
export const studio = {
  get: () => useStudio.getState(),
  subscribe: useStudio.subscribe,
}
