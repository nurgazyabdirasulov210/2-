import { useEffect, useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

const IDEAS = [
  'Прогулка до реки',
  'Читать бумажную книгу',
  'Ужин без телефона',
  'Позвонить бабушке',
  'Полить цветы и посидеть у окна',
  'Сварить кофе в турке',
  'Сыграть партию в шахматы',
  'Рисовать карандашом',
  'Йога на полу',
  'Просто подумать',
]
const CHIPS = ['Прогулка', 'Книга', 'Ужин', 'Сон', 'Друзья']
const MAX = 80

export function IntentionInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId()
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (value || reduce) return
    const t = window.setInterval(() => setI((x) => (x + 1) % IDEAS.length), 3200)
    return () => window.clearInterval(t)
  }, [value, reduce])

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        Что будешь делать без экрана?
      </label>
      <div
        className={
          'relative rounded-md border bg-surface-1 transition-[border-color,box-shadow] duration-200 ' +
          (focused
            ? 'border-focus shadow-[0_0_0_4px_color-mix(in_oklch,var(--focus)_20%,transparent)]'
            : 'border-border-strong')
        }
      >
        <input
          id={id}
          value={value}
          maxLength={MAX}
          autoComplete="off"
          enterKeyHint="done"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          className="peer h-14 w-full bg-transparent px-4 font-display text-[1.375rem] italic text-text-1 outline-none placeholder:text-transparent"
          placeholder={IDEAS[i]}
          aria-describedby={`${id}-hint`}
        />
        {!value && (
          <div className="pointer-events-none absolute inset-y-0 left-4 right-4 flex items-center overflow-hidden" aria-hidden>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={i}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14 }}
                transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                className="truncate font-display text-[1.375rem] italic text-text-3"
              >
                {IDEAS[i]}…
              </motion.span>
            </AnimatePresence>
          </div>
        )}
        {value && (
          <span className="pointer-events-none absolute bottom-1.5 right-3 font-mono text-[10px] text-text-3 tabular" aria-hidden>
            {value.length}/{MAX}
          </span>
        )}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5" id={`${id}-hint`}>
        <span className="sr-only">Необязательно. Станет подписью на кадре. Быстрые варианты:</span>
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={
              'h-8 rounded-full border px-3 text-caption transition-colors duration-150 ' +
              (value === c
                ? 'border-accent/60 bg-accent/10 text-text-1'
                : 'border-border text-text-2 hover:border-border-strong hover:text-text-1')
            }
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}
