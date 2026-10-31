// Generative darkroom ambience on WebAudio — no audio files.
//   ambience: room tone (filtered brown noise) + faint safelight hum, random water drips,
//             occasional soft tray agitation sloshes, all through a small synthetic room reverb.
//   cues:     playCue('lights-off' | 'door-open' | 'reveal' | 'click')
// AudioContext is created lazily (call start()/playCue() from a user gesture the first time).
// `enabled` follows settings.sound in the store automatically; setEnabled() overrides it too.
import { useStudio } from '../store'

export type CueName = 'lights-off' | 'door-open' | 'reveal' | 'click'

const MASTER_LEVEL = 0.55
const FADE_IN_S = 2.5
const FADE_OUT_S = 1.2
/** Events are pre-scheduled on the audio clock this far ahead, so throttled background timers don't starve it. */
const LOOKAHEAD_S = 75

type Ctx = AudioContext

let ctx: Ctx | null = null
let master: GainNode | null = null
let reverbIn: GainNode | null = null
let noiseBuf: AudioBuffer | null = null
let brownBuf: AudioBuffer | null = null

let enabled = true
let wantRunning = false

interface Bus {
  gain: GainNode
  sources: AudioScheduledSourceNode[]
  timer: number
  nextDrip: number
  nextSlosh: number
}
let bus: Bus | null = null

// ---------------------------------------------------------------- setup

function getCtx(): Ctx | null {
  if (ctx) return ctx
  try {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC({ latencyHint: 'playback' })
    master = ctx.createGain()
    master.gain.value = MASTER_LEVEL
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.ratio.value = 3
    master.connect(comp).connect(ctx.destination)

    // small dark room reverb
    const conv = ctx.createConvolver()
    conv.buffer = makeImpulse(ctx, 1.8, 2.6)
    const wet = ctx.createGain()
    wet.gain.value = 0.35
    reverbIn = ctx.createGain()
    reverbIn.connect(conv).connect(wet).connect(master)

    noiseBuf = makeWhite(ctx, 2)
    brownBuf = makeBrown(ctx, 6)
    return ctx
  } catch {
    ctx = null
    return null
  }
}

function resume(c: Ctx) {
  if (c.state === 'suspended') c.resume().catch(() => {})
}

function makeWhite(c: Ctx, seconds: number): AudioBuffer {
  const b = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return b
}

function makeBrown(c: Ctx, seconds: number): AudioBuffer {
  const b = c.createBuffer(2, Math.floor(c.sampleRate * seconds), c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch)
    let last = 0
    for (let i = 0; i < d.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
      d[i] = last * 3.5
    }
    // crossfade loop edges to avoid a click
    const xf = Math.floor(c.sampleRate * 0.05)
    for (let i = 0; i < xf; i++) {
      const t = i / xf
      d[i] = d[i] * t + d[d.length - xf + i] * (1 - t)
    }
  }
  return b
}

function makeImpulse(c: Ctx, seconds: number, decay: number): AudioBuffer {
  const len = Math.floor(c.sampleRate * seconds)
  const b = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return b
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)

// ---------------------------------------------------------------- voices

/** Water drip: sine "plip" with fast upward-then-down pitch glide + tiny noise tick. */
function drip(c: Ctx, out: AudioNode, t: number, level = 1) {
  const f0 = rand(900, 1700)
  const o = c.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(f0 * 0.7, t)
  o.frequency.exponentialRampToValueAtTime(f0 * 1.35, t + 0.012)
  o.frequency.exponentialRampToValueAtTime(f0 * 0.55, t + 0.11)
  const g = c.createGain()
  const peak = 0.05 * level * rand(0.5, 1)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + 0.004)
  g.gain.exponentialRampToValueAtTime(0.0001, t + rand(0.12, 0.22))
  const pan = c.createStereoPanner()
  pan.pan.value = rand(-0.6, 0.6)
  o.connect(g).connect(pan)
  pan.connect(out)
  if (reverbIn) pan.connect(reverbIn)
  o.start(t)
  o.stop(t + 0.3)
  return o
}

/** Tray agitation: band-passed noise swelling back and forth 2–3 times. */
function slosh(c: Ctx, out: AudioNode, t: number) {
  if (!noiseBuf) return null
  const src = c.createBufferSource()
  src.buffer = noiseBuf
  src.loop = true
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 0.9
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 1800
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  const waves = Math.floor(rand(2, 4))
  let tt = t
  for (let i = 0; i < waves; i++) {
    const up = rand(0.45, 0.7)
    const down = rand(0.7, 1.1)
    const peak = 0.022 * (1 - i * 0.22)
    bp.frequency.setValueAtTime(rand(380, 520), tt)
    bp.frequency.linearRampToValueAtTime(rand(750, 1100), tt + up)
    bp.frequency.linearRampToValueAtTime(rand(360, 480), tt + up + down)
    g.gain.exponentialRampToValueAtTime(peak, tt + up)
    g.gain.exponentialRampToValueAtTime(0.0008, tt + up + down)
    tt += up + down
  }
  g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.3)
  const pan = c.createStereoPanner()
  pan.pan.value = rand(-0.3, 0.3)
  src.connect(bp).connect(lp).connect(g).connect(pan)
  pan.connect(out)
  if (reverbIn) pan.connect(reverbIn)
  src.start(t, rand(0, 1))
  src.stop(tt + 0.4)
  // a couple of droplets falling back into the tray
  if (Math.random() < 0.6) drip(c, out, tt - rand(0.2, 0.5), 0.5)
  return src
}

// ---------------------------------------------------------------- ambience

function scheduleAhead() {
  const c = ctx
  const b = bus
  if (!c || !b) return
  const horizon = c.currentTime + LOOKAHEAD_S
  while (b.nextDrip < horizon) {
    b.sources.push(drip(c, b.gain, b.nextDrip))
    // occasional double drip
    if (Math.random() < 0.25) b.sources.push(drip(c, b.gain, b.nextDrip + rand(0.25, 0.6), 0.6))
    b.nextDrip += rand(3.5, 12)
  }
  while (b.nextSlosh < horizon) {
    const s = slosh(c, b.gain, b.nextSlosh)
    if (s) b.sources.push(s)
    b.nextSlosh += rand(18, 45)
  }
  // forget finished one-shots
  if (b.sources.length > 200) b.sources = b.sources.slice(-120)
}

function startAmbience() {
  const c = getCtx()
  if (!c || !master || !brownBuf || bus) return
  resume(c)
  const t = c.currentTime
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(1, t + FADE_IN_S)
  gain.connect(master)

  // room tone
  const room = c.createBufferSource()
  room.buffer = brownBuf
  room.loop = true
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 320
  const roomG = c.createGain()
  roomG.gain.value = 0.11
  room.connect(lp).connect(roomG).connect(gain)
  room.start(t)

  // safelight hum (100 Hz + harmonics), barely there, slowly breathing
  const humG = c.createGain()
  humG.gain.value = 0.0045
  const sources: AudioScheduledSourceNode[] = [room]
  for (const [f, a] of [[100, 1], [200, 0.35], [300, 0.12]] as const) {
    const o = c.createOscillator()
    o.frequency.value = f
    const og = c.createGain()
    og.gain.value = a
    o.connect(og).connect(humG)
    o.start(t)
    sources.push(o)
  }
  const lfo = c.createOscillator()
  lfo.frequency.value = 0.07
  const lfoG = c.createGain()
  lfoG.gain.value = 0.002
  lfo.connect(lfoG).connect(humG.gain)
  lfo.start(t)
  sources.push(lfo)
  humG.connect(gain)

  bus = { gain, sources, timer: 0, nextDrip: t + rand(1.5, 4), nextSlosh: t + rand(6, 14) }
  scheduleAhead()
  bus.timer = window.setInterval(scheduleAhead, 1000)
}

function stopAmbience() {
  const c = ctx
  const b = bus
  if (!c || !b) return
  bus = null
  window.clearInterval(b.timer)
  const t = c.currentTime
  b.gain.gain.cancelScheduledValues(t)
  b.gain.gain.setValueAtTime(Math.max(0.0001, b.gain.gain.value), t)
  b.gain.gain.exponentialRampToValueAtTime(0.0001, t + FADE_OUT_S)
  window.setTimeout(() => {
    for (const s of b.sources) {
      try {
        s.stop()
      } catch {
        /* already stopped */
      }
    }
    try {
      b.gain.disconnect()
    } catch {
      /* ignore */
    }
  }, FADE_OUT_S * 1000 + 200)
}

// ---------------------------------------------------------------- cues

function noiseBurst(c: Ctx, out: AudioNode, t: number, dur: number, type: BiquadFilterType, freq: number, level: number) {
  if (!noiseBuf) return
  const s = c.createBufferSource()
  s.buffer = noiseBuf
  const f = c.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  const g = c.createGain()
  g.gain.setValueAtTime(level, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  s.connect(f).connect(g).connect(out)
  s.start(t, Math.random())
  s.stop(t + dur + 0.05)
}

function tone(c: Ctx, out: AudioNode, t: number, freq: number, level: number, attack: number, decay: number, type: OscillatorType = 'sine', toFreq?: number) {
  const o = c.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, t + attack + decay * 0.6)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(level, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  o.connect(g).connect(out)
  o.start(t)
  o.stop(t + attack + decay + 0.05)
}

function cue(c: Ctx, name: CueName) {
  const out = master!
  const t = c.currentTime + 0.01
  switch (name) {
    case 'click':
      noiseBurst(c, out, t, 0.012, 'highpass', 2500, 0.12)
      tone(c, out, t, 1800, 0.02, 0.001, 0.03, 'triangle')
      break
    case 'lights-off':
      // switch snap, then a soft low thump as the room goes dark
      noiseBurst(c, out, t, 0.015, 'highpass', 2000, 0.16)
      noiseBurst(c, out, t + 0.03, 0.01, 'bandpass', 1200, 0.08)
      tone(c, out, t + 0.05, 90, 0.12, 0.01, 0.6, 'sine', 42)
      if (reverbIn) tone(c, reverbIn, t + 0.05, 180, 0.03, 0.02, 0.8, 'sine', 90)
      break
    case 'door-open': {
      // latch + a quiet airy sweep of light coming in
      noiseBurst(c, out, t, 0.02, 'bandpass', 1500, 0.1)
      if (!noiseBuf) break
      const s = c.createBufferSource()
      s.buffer = noiseBuf
      const f = c.createBiquadFilter()
      f.type = 'bandpass'
      f.Q.value = 1.2
      f.frequency.setValueAtTime(400, t)
      f.frequency.exponentialRampToValueAtTime(2600, t + 0.9)
      const g = c.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.03, t + 0.35)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3)
      s.connect(f).connect(g).connect(out)
      if (reverbIn) g.connect(reverbIn)
      s.start(t)
      s.stop(t + 1.4)
      break
    }
    case 'reveal': {
      // soft chime: open fifth + octave, staggered, long tail into the reverb
      const dest = reverbIn ?? out
      const notes = [392, 587.33, 783.99, 1174.66]
      notes.forEach((f, i) => {
        const tt = t + i * 0.11
        tone(c, out, tt, f, 0.035 / (1 + i * 0.3), 0.01, 2.4)
        tone(c, dest, tt, f * 2.005, 0.008, 0.01, 1.6)
      })
      drip(c, out, t + 0.6, 0.6)
      break
    }
  }
}

// ---------------------------------------------------------------- public API

export const sound = {
  /** Start the ambience (fades in). Call from a user gesture the first time. No-op if disabled. */
  start(): void {
    wantRunning = true
    if (enabled) startAmbience()
  },
  /** Stop the ambience (fades out). */
  stop(): void {
    wantRunning = false
    stopAmbience()
  },
  /** Enable/disable all sound. Disabling fades ambience out; enabling resumes it if start() was requested. */
  setEnabled(b: boolean): void {
    enabled = b
    if (!b) stopAmbience()
    else if (wantRunning) startAmbience()
  },
  /** One-shot cue. Silently ignored when disabled or WebAudio is unavailable. */
  playCue(name: CueName): void {
    if (!enabled) return
    const c = getCtx()
    if (!c || !master) return
    resume(c)
    try {
      cue(c, name)
    } catch {
      /* ignore */
    }
  },
  /** Unlock the AudioContext from a user gesture without making a sound. */
  unlock(): void {
    const c = getCtx()
    if (c) resume(c)
  },
  get enabled(): boolean {
    return enabled
  },
  get running(): boolean {
    return bus != null
  },
}

// Keep `enabled` in sync with settings.sound.
try {
  enabled = useStudio.getState().settings.sound
  useStudio.subscribe((s, prev) => {
    if (s.settings.sound !== prev.settings.sound) sound.setEnabled(s.settings.sound)
  })
  // after persist rehydration
  useStudio.persist?.onFinishHydration?.((s) => sound.setEnabled(s.settings.sound))
} catch {
  /* store unavailable (tests) */
}

export default sound
