import { Check, Minus } from 'lucide-react'
import { Reveal } from '../ui/Reveal'

const ROWS: [string, string][] = [
  ['Запрещают и блокируют', 'Награждают за то, что вас не было'],
  ['Стыдят за срыв', 'Оставляют честный след — и только'],
  ['Аккаунт, подписка, облако', 'Открыли — и погасили свет'],
  ['Считают потерянное время', 'Собирают то, что проявилось'],
]

export function Manifesto() {
  return (
    <section className="relative overflow-hidden px-4 py-24 md:px-8 md:py-40">
      <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(224,69,58,.09),transparent)] blur-2xl" />
      <div className="mx-auto max-w-[1200px]">
        <Reveal>
          <p className="mb-8 flex items-center gap-3 font-mono text-overline text-text-3 uppercase">
            <span className="text-accent">04</span>
            <span aria-hidden className="h-px w-6 bg-border-strong" />
            Манифест
          </p>
        </Reveal>
        <h2 className="font-display text-display-xl font-medium text-balance text-text-1">
          <Reveal as="span" className="block text-text-3">Forest сажает дерево.</Reveal>
          <Reveal as="span" delay={0.12} className="block text-text-3">Opal блокирует.</Reveal>
          <Reveal as="span" delay={0.24} className="block">
            Мы <em className="font-normal text-accent-soft">проявляем</em>.
          </Reveal>
        </h2>
        <Reveal delay={0.2} className="mt-10 max-w-[40rem]">
          <p className="text-body-lg text-pretty text-text-2">
            Время без экрана — не наказание и не подвиг. Это то, что остаётся на плёнке: прогулка, книга, разговор, сон после обеда. Мы не
            считаем, сколько вы потеряли. Мы показываем, что у вас появилось.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-16 overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-2 bg-surface-1 font-mono text-overline uppercase">
            <div className="border-r border-border px-4 py-4 text-text-3 sm:px-6">Приложения-надзиратели</div>
            <div className="px-4 py-4 text-accent sm:px-6">Проявка</div>
          </div>
          {ROWS.map(([them, us]) => (
            <div key={us} className="grid grid-cols-2 border-t border-border">
              <div className="flex items-start gap-3 border-r border-border px-4 py-5 text-body-sm text-text-3 sm:px-6 sm:text-body">
                <Minus aria-hidden className="mt-1 hidden size-4 shrink-0 sm:block" />
                {them}
              </div>
              <div className="flex items-start gap-3 bg-surface-1/40 px-4 py-5 text-body-sm text-text-1 sm:px-6 sm:text-body">
                <Check aria-hidden className="mt-1 hidden size-4 shrink-0 text-accent sm:block" />
                {us}
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
