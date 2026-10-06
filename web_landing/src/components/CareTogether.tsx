import BellIcon from '../assets/icons/bell.svg?react'
import KeyIcon from '../assets/icons/key.svg?react'
import LeafIcon from '../assets/icons/leaf.svg?react'
import SproutIcon from '../assets/icons/sprout.svg?react'
import PhoneMockup from './PhoneMockup'
import SectionHeader from './SectionHeader'

const stories = [
  { text: "Laura just watered your Basil while you're away this weekend.", Icon: KeyIcon, bubble: 'bg-soil' },
  { text: "Your Fern's watering streak broke. Lisa sent you a nudge.", Icon: BellIcon, bubble: 'bg-green' },
  { text: 'Your Monstera just sprouted a new leaf.', Icon: LeafIcon, bubble: 'bg-leaf' },
  { text: "Alisa's Orchid finally bloomed.", Icon: SproutIcon, bubble: 'bg-clay' },
]

function CareTogetherVisual() {
  return (
    <div className="relative h-[429px] w-[338px] shrink-0 sm:h-[660px] sm:w-[520px]">
      <div className="absolute top-0 left-0 h-[660px] w-[520px] origin-top-left scale-[0.65] sm:scale-100">
        <div className="absolute top-20 left-2.5 size-[500px] rounded-full bg-sand" />
        <PhoneMockup size={300} className="absolute top-5 left-[110px]" />
      </div>
    </div>
  )
}

function CareTogether() {
  return (
    <section className="bg-cream">
      <div className="mx-auto flex max-w-page flex-col items-center gap-12 py-20 px-page xl:flex-row xl:justify-between xl:py-[120px]">
        <div className="flex w-full max-w-[540px] flex-col items-start gap-7">
          <SectionHeader
            align="left"
            eyebrow="Care together"
            title="You don't have to keep them alive alone."
            subtitle="Add friends as backup for when life gets busy. The feed isn't just photos: it tells you what is happening to the plants you care about, so you can step in when someone needs a hand."
          />

          <ul className="flex w-full flex-col gap-3">
            {stories.map(({ text, Icon, bubble }) => (
              <li
                key={text}
                className="flex items-center gap-3.5 rounded-2xl border-[1.5px] border-sand bg-white py-3.5 pr-5 pl-4"
              >
                <span className={`flex size-[38px] shrink-0 items-center justify-center rounded-full text-white ${bubble}`}>
                  <Icon width={20} height={20} />
                </span>
                <p className="text-base leading-[1.4]">{text}</p>
              </li>
            ))}
          </ul>

          <p className="max-w-[520px] text-base leading-[1.55] font-medium text-soil">
            And when a plant doesn't make it, it finds its place in the community cemetery. Every plant deserves to be
            remembered.
          </p>
        </div>

        <CareTogetherVisual />
      </div>
    </section>
  )
}

export default CareTogether
