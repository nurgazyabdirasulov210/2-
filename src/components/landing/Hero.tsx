import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { DevelopingDemo } from './DevelopingDemo'

const fade = (delay: number, reduce: boolean | null) =>
  reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.12 } }
    : {
        initial: { opacity: 0, y: 16, filter: 'blur(8px)' },
        animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
        transition: { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] as const },
      }

export function Hero() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const yDemo = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90])
  const yGlow = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -140])
  const yText = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 40])

  return (
    <section ref={ref} className="relative isolate overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28 lg:min-h-[100dvh] lg:pt-32">
      {/* ambient */}
      <motion.div aria-hidden style={{ y: yGlow }} className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[8%] right-[-20%] h-[640px] w-[640px] rounded-full bg-[radial-gradient(closest-side,rgba(224,69,58,.16),transparent)] blur-3xl lg:right-[2%]" />
        <div className="absolute top-[40%] left-[-15%] h-[520px] w-[520px] animate-drift rounded-full bg-[radial-gradient(closest-side,rgba(106,168,255,.06),transparent)] blur-3xl" />
      </motion.div>

      <div className="mx-auto grid max-w-[1200px] items-center gap-14 px-4 md:px-8 lg:grid-cols-12 lg:gap-10">
        <motion.div style={{ y: yText }} className="lg:col-span-7">
          <motion.p {...fade(0.05, reduce)} className="mb-6 inline-flex items-center gap-2.5 font-mono text-overline text-text-2 uppercase">
            <span className="h-px w-8 bg-safelight" aria-hidden />
            Тёмная комната для офлайн-времени
          </motion.p>
          <motion.h1 {...fade(0.15, reduce)} className="font-display text-[clamp(3rem,1.9rem+4.2vw,6.25rem)] leading-[0.98] font-medium tracking-[-0.03em] text-balance text-text-1">
            Отложи экран&nbsp;— и&nbsp;смотри, что{' '}
            <em className="relative font-normal whitespace-nowrap text-accent-soft">
              проявится
              <span aria-hidden className="absolute inset-x-0 -bottom-1 -z-10 h-[40%] bg-safelight/15 blur-xl" />
            </em>
            .
          </motion.h1>
          <motion.p {...fade(0.3, reduce)} className="mt-7 max-w-[34rem] text-body-lg text-pretty text-text-2">
            Пока вас нет у экрана, на фотобумаге медленно проявляется уникальный кадр. Вернулись
            раньше&nbsp;— свет попадёт на бумагу, и это будет видно. Никаких запретов: только плёнка, время и честный след.
          </motion.p>
          <motion.div {...fade(0.42, reduce)} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/darkroom"
              className="group inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-safelight px-7 text-body-lg font-medium text-white shadow-[0_0_0_1px_rgba(224,69,58,.5),0_10px_40px_-6px_var(--safelight-glow)] transition-[filter,transform] duration-200 ease-out-quint hover:brightness-110 active:scale-[0.97]"
            >
              Войти в тёмную комнату
              <ArrowRight aria-hidden className="size-5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how"
              className="inline-flex h-14 items-center justify-center rounded-full px-6 text-body text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1"
            >
              Как это работает
            </a>
          </motion.div>
          <motion.ul {...fade(0.55, reduce)} className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-caption text-text-3 uppercase">
            <li>Без AI</li>
            <li aria-hidden className="hidden sm:block">·</li>
            <li>Без аккаунта</li>
            <li aria-hidden className="hidden sm:block">·</li>
            <li>Данные остаются у вас</li>
          </motion.ul>
        </motion.div>

        <motion.div style={{ y: yDemo }} className="lg:col-span-5">
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reduce ? 0.12 : 1.2, delay: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <DevelopingDemo />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
