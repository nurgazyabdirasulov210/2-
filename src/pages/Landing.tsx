import { useEffect } from 'react'
import { LandingNav } from '../components/landing/LandingNav'
import { Hero } from '../components/landing/Hero'
import { HowItWorks } from '../components/landing/HowItWorks'
import { HonestRule } from '../components/landing/HonestRule'
import { FilmStrip } from '../components/landing/FilmStrip'
import { Manifesto } from '../components/landing/Manifesto'
import { Privacy } from '../components/landing/Privacy'
import { Faq } from '../components/landing/Faq'
import { FinalCta, Footer } from '../components/landing/Finale'

function Ticker() {
  const words = ['Без AI', 'Без аккаунта', 'Без подписки', 'Без уведомлений-упрёков', 'Только плёнка', 'и ваше время']
  const row = (
    <span className="flex shrink-0 items-center gap-8 pr-8">
      {words.map((w) => (
        <span key={w} className="flex items-center gap-8">
          {w}
          <span aria-hidden className="size-1.5 rounded-full bg-safelight" />
        </span>
      ))}
    </span>
  )
  return (
    <div aria-hidden className="relative overflow-hidden border-y border-border py-5 font-display text-h2 text-text-2 italic md:text-h1">
      <div className="flex w-max animate-[marquee_40s_linear_infinite]">
        {row}
        {row}
      </div>
    </div>
  )
}

export default function Landing() {
  useEffect(() => {
    document.title = 'Проявка — отложи экран и смотри, что проявится'
  }, [])
  return (
    <div className="relative overflow-x-clip">
      <style>{'@keyframes marquee{to{transform:translate3d(-50%,0,0)}}'}</style>
      <LandingNav />
      <main id="main">
        <Hero />
        <Ticker />
        <HowItWorks />
        <HonestRule />
        <FilmStrip />
        <Manifesto />
        <Privacy />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
