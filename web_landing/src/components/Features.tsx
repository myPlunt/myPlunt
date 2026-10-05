import BookIcon from '../assets/icons/book.svg?react'
import CameraIcon from '../assets/icons/camera.svg?react'
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
    body: 'Snap your plants as they grow and share how far they have come, from first leaf to full jungle.',
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

function Features() {
  return (
    <section id="features" className="scroll-mt-4 bg-cream">
      <div className="mx-auto flex max-w-page flex-col items-center gap-16 py-20 px-page lg:py-[120px]">
        <SectionHeader
          eyebrow="Features"
          title="Everything you need to keep them thriving."
          subtitle="The right reminder at the right moment, alerts for the weather where each plant lives, and backup when you need it."
        />

        <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, body, Icon }) => (
            <article
              key={title}
              className="flex flex-col items-start gap-4 rounded-3xl border-[1.5px] border-sand bg-paper px-8 pt-8 pb-9"
            >
              <div className="flex size-14 items-center justify-center rounded-2xl bg-sand text-green">
                <Icon width={28} height={28} />
              </div>
              <h3 className="font-primary text-[31px] leading-none font-semibold">{title}</h3>
              <p className="text-base leading-[1.55] text-ink">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
