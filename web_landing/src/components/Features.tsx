import { useEffect, useRef, useState } from 'react'
import BookIcon from '../assets/icons/book.svg?react'
import CameraIcon from '../assets/icons/camera.svg?react'
import ChevronLeftIcon from '../assets/icons/chevron-left.svg?react'
import ChevronRightIcon from '../assets/icons/chevron-right.svg?react'
import DropIcon from '../assets/icons/drop.svg?react'
import KeyIcon from '../assets/icons/key.svg?react'
import RainIcon from '../assets/icons/rain.svg?react'
import StarIcon from '../assets/icons/star.svg?react'
import SectionHeader from './SectionHeader'

const features = [
  {
    title: 'Watering reminders',
    body: 'Reminders tuned to each plant, so watering fits into your week instead of slipping through it.',
    Icon: DropIcon,
  },
  {
    title: 'Real-time weather alerts',
    body: "Alerts for your plant's exact location, before frost, heatwaves or storms hit.",
    Icon: RainIcon,
  },
  {
    title: 'Hand the keys',
    body: 'Away for the weekend? A trusted friend takes over care, and you can follow every watering.',
    Icon: KeyIcon,
  },
  {
    title: 'Show your progress',
    body: 'Take a picture of your plants as they grow and share how far they have come, from first leaf to full jungle.',
    Icon: CameraIcon,
  },
  {
    title: 'Plantdex',
    body: 'Discover regional plants that grow well where you live, before you bring them home.',
    Icon: BookIcon,
  },
  {
    title: 'Achievements',
    body: 'Earn achievements as your collection grows and your care streaks get longer.',
    Icon: StarIcon,
  },
]

const count = features.length
const AUTOPLAY_MS = 3200

// Position of card `index` relative to the active card, wrapped so the carousel loops: 
function offsetOf(index: number, active: number) {
  const distance = (index - active + count) % count
  return distance > count / 2 ? distance - count : distance
}

// Translations are a percentage of the card's own width, so the layout scales with it.
const positions: Record<number, string> = {
  [-3]: '-translate-x-[280%] scale-[0.85] opacity-0',
  [-2]: '-translate-x-[190%] scale-[0.85] opacity-30',
  [-1]: '-translate-x-[99%] scale-[0.85] opacity-60',
  0: 'translate-x-0 scale-100 opacity-100 z-10',
  1: 'translate-x-[99%] scale-[0.85] opacity-60',
  2: 'translate-x-[190%] scale-[0.85] opacity-30',
  3: 'translate-x-[280%] scale-[0.85] opacity-0',
}

function Features() {
  const [{ active, previous }, setSlide] = useState({ active: 0, previous: 0 })

  const goTo = (index: number) => setSlide({ active: (index + count) % count, previous: active })

  // Autoplay: next card every 4s. The timer restarts after every move (manual or automatic),
  // pauses while hovered or focused, and is off when the user prefers reduced motion.
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setTimeout(
      () => setSlide((slide) => ({ active: (slide.active + 1) % count, previous: slide.active })),
      AUTOPLAY_MS,
    )
    return () => clearTimeout(timer)
  }, [active, paused])

  // Swipe on touch screens: a horizontal drag of 50px or more moves one card.
  const touchStartX = useRef<number | null>(null)
  const onTouchEnd = (endX: number) => {
    if (touchStartX.current === null) return
    const distance = endX - touchStartX.current
    if (Math.abs(distance) >= 50) goTo(distance < 0 ? active + 1 : active - 1)
    touchStartX.current = null
  }

  // Every card slides by the same number of steps, except the ones that wrap around the loop.
  const steps = offsetOf(active, previous)

  return (
    <section id="features" className="scroll-mt-4 overflow-hidden bg-cream">
      <div className="mx-auto flex max-w-page flex-col items-center gap-16 py-20 px-page lg:py-[120px]">
        <SectionHeader
          eyebrow="Features"
          title="Everything you need to keep them thriving."
          subtitle="The right reminder at the right moment, alerts for the weather where each plant lives, and backup when you need it."
        />

        <div
          className="flex w-full flex-col items-center gap-10"
          onPointerEnter={(event) => event.pointerType === 'mouse' && setPaused(true)}
          onPointerLeave={(event) => event.pointerType === 'mouse' && setPaused(false)}
          onFocus={(event) => event.target.matches(':focus-visible') && setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div
            className="grid w-full justify-items-center [grid-template-areas:'stack']"
            aria-roledescription="carousel"
            aria-label="Features"
            onTouchStart={(event) => (touchStartX.current = event.touches[0].clientX)}
            onTouchEnd={(event) => onTouchEnd(event.changedTouches[0].clientX)}
          >
            {features.map(({ title, body, Icon }, index) => {
              const offset = offsetOf(index, active)
              const wrapped = offset - offsetOf(index, previous) !== -steps
              const isActive = offset === 0

              return (
                <article
                  key={title}
                  aria-hidden={!isActive}
                  onClick={isActive ? undefined : () => goTo(index)}
                  className={`flex w-[300px] flex-col items-start gap-4 rounded-3xl border-[1.5px] border-sand px-8 pt-8 pb-9 [grid-area:stack] sm:w-[376px] ${positions[offset]} ${
                    wrapped ? 'transition-none' : 'transition-all duration-500 ease-out motion-reduce:transition-none'
                  } ${isActive ? 'bg-white shadow-card' : 'cursor-pointer bg-paper'}`}
                >
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-sand text-green">
                    <Icon width={28} height={28} />
                  </div>
                  <h3 className="font-primary text-[31px] leading-none font-semibold">{title}</h3>
                  <p className="text-base leading-[1.55] text-ink">{body}</p>
                </article>
              )
            })}
          </div>

          <div className="flex w-full max-w-[880px] items-center justify-between gap-6">
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              aria-label="Previous feature"
              className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-green text-green transition-colors hover:bg-green hover:text-cream"
            >
              <ChevronLeftIcon width={24} height={24} />
            </button>

            <div className="flex gap-2.5">
              {features.map(({ title }, index) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Show ${title}`}
                  aria-current={index === active}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === active ? 'w-7 bg-green' : 'w-2.5 bg-green/25 hover:bg-green/50'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => goTo(active + 1)}
              aria-label="Next feature"
              className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-green text-green transition-colors hover:bg-green hover:text-cream"
            >
              <ChevronRightIcon width={24} height={24} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features
