import { useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useStudio } from '../../store'
import { sound } from '../../lib/sound'
import { formatClock } from '../../lib/format'
import type { FilmId, Weather } from '../../types'
import { FilmPicker } from './FilmPicker'
import { ExposureDial } from './ExposureDial'
import { IntentionInput } from './IntentionInput'
import { WeatherChip } from './WeatherChip'
import { PreviewPrint } from './PreviewPrint'
import { SafelightButton } from './SafelightButton'
import { filmOf, randomSeed } from './util'

const PREFS_KEY = 'proyavka:darkroom-prefs'
interface Prefs {
  film: FilmId
  minutes: number
}
function readPrefs(fallbackFilm: FilmId): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null') as Partial<Prefs> | null
    return {
      film: (p?.film as FilmId) || fallbackFilm,
      minutes: typeof p?.minutes === 'number' && p.minutes >= 5 && p.minutes <= 180 ? p.minutes : 25,
    }
  } catch {
    return { film: fallbackFilm, minutes: 25 }
  }
}
function writePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

function Step({ n, title, hint, children, aside }: { n: string; title: string; hint?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section aria-labelledby={`step-${n}`}>
      <div className="mb-4 flex items-end justify-between gap-4 border-b border-border pb-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-mono-sm text-accent tabular">{n}</span>
          <h2 id={`step-${n}`} className="font-display text-h2 font-medium text-text-1">
            {title}
          </h2>
          {hint && <span className="hidden text-caption text-text-3 sm:inline">{hint}</span>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}

export function Setup() {
  const reduce = useReducedMotion()
  const startSession = useStudio((s) => s.startSession)
  const weatherOn = useStudio((s) => s.settings.weather)
  const frames = useStudio((s) => s.frames)
  const lastFilm = frames.length ? frames[frames.length - 1].film : 'portra'

  const [prefs] = useState(() => readPrefs(lastFilm))
  const [film, setFilm] = useState<FilmId>(prefs.film)
  const [minutes, setMinutes] = useState(prefs.minutes)
  const [intention, setIntention] = useState('')
  const [seed, setSeed] = useState(randomSeed)
  const [weather, setWeather] = useState<Weather | null>(null)
  const [starting, setStarting] = useState(false)

  const nextNumber = frames.reduce((m, f) => Math.max(m, f.number), 0) + 1
  const f = filmOf(film)

  const pickFilm = (id: FilmId) => {
    if (id === film) return
    setFilm(id)
    setSeed(randomSeed())
    sound.playCue('click')
  }

  const start = async () => {
    if (starting) return
    setStarting(true)
    writePrefs({ film, minutes })
    sound.unlock()
    try {
      await startSession({ film, durationMs: minutes * 60_000, intention: intention.trim() })
    } finally {
      setStarting(false)
    }
  }

  const fade = (i: number) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.12 } }
      : {
          initial: { opacity: 0, y: 16, filter: 'blur(6px)' },
          animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
          transition: { duration: 0.6, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] as const },
        }

  return (
    <div className="mx-auto w-full max-w-[1180px] overflow-x-clip pt-6 lg:overflow-x-visible md:pt-4">
      <motion.header {...fade(0)} className="relative mb-10 flex items-start justify-between gap-6 md:mb-14">
        <div className="max-w-[640px]">
          <p className="text-overline uppercase text-text-3">
            Тёмная комната <span className="text-accent">·</span> кадр <span className="font-mono tabular">№{nextNumber}</span>
          </p>
          <h1 className="mt-3 font-display text-display-xl font-medium text-text-1">
            Подготовка<span className="italic text-text-2">.</span>
          </h1>
          <p className="mt-4 max-w-[46ch] text-body-lg text-text-2">
            Заряди плёнку, выставь выдержку — и погаси свет. Кадр проявится, пока ты живёшь
            <span className="font-display italic text-text-1"> без экрана</span>.
          </p>
        </div>
        {/* mobile mini-print */}
        <div className="w-[30%] max-w-[132px] shrink-0 pt-2 lg:hidden" aria-hidden>
          <PreviewPrint film={film} seed={seed} weather={weather} nextNumber={nextNumber} onShuffle={() => setSeed(randomSeed())} compact />
        </div>
      </motion.header>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:gap-16">
        <div className="flex min-w-0 flex-col gap-12">
          <motion.div {...fade(1)}>
            <Step n="01" title="Плёнка" hint="характер будущего кадра">
              <FilmPicker value={film} onChange={pickFilm} />
            </Step>
          </motion.div>

          <motion.div {...fade(2)}>
            <Step n="02" title="Выдержка" hint="сколько времени без экрана">
              <ExposureDial minutes={minutes} onChange={setMinutes} />
            </Step>
          </motion.div>

          <motion.div {...fade(3)}>
            <Step
              n="03"
              title="Намерение"
              hint="необязательно"
              aside={weatherOn ? <WeatherChip onWeather={setWeather} /> : undefined}
            >
              <p className="mb-3 text-body-sm text-text-2">Что будешь делать без экрана? Это станет подписью на кадре.</p>
              <IntentionInput value={intention} onChange={setIntention} />
            </Step>
          </motion.div>
        </div>

        <motion.aside {...fade(2)} className="lg:sticky lg:top-24 lg:self-start">
          <div className="hidden px-6 pb-10 pt-4 lg:block">
            <PreviewPrint film={film} seed={seed} weather={weather} nextNumber={nextNumber} onShuffle={() => setSeed(randomSeed())} />
          </div>
          <div className="rounded-xl border border-border bg-surface-1/60 p-4 sm:p-5">
            <dl className="mb-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <dt className="text-overline uppercase text-text-3">плёнка</dt>
                <dd className="mt-1 truncate font-mono text-mono-sm text-text-1">{f.short}</dd>
              </div>
              <div>
                <dt className="text-overline uppercase text-text-3">выдержка</dt>
                <dd className="mt-1 font-mono text-mono-sm text-text-1 tabular">{formatClock(minutes * 60_000)}</dd>
              </div>
              <div>
                <dt className="text-overline uppercase text-text-3">кадр</dt>
                <dd className="mt-1 font-mono text-mono-sm text-text-1 tabular">№{nextNumber}</dd>
              </div>
            </dl>
            <SafelightButton onClick={start} busy={starting} />
            <p className="mt-3 text-center text-caption text-text-3">
              Свет погаснет. Уйди с вкладки или просто отложи телефон.
            </p>
          </div>
        </motion.aside>
      </div>
    </div>
  )
}
