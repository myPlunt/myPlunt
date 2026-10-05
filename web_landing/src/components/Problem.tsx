import BookIcon from '../assets/icons/book.svg?react'
import ClockIcon from '../assets/icons/clock.svg?react'
import HandHeartIcon from '../assets/icons/hand-heart.svg?react'
import logoMyPlunt from '../assets/logo-myplunt.svg'
import SectionHeader from './SectionHeader'

const problems = [
  {
    title: 'Life gets overloaded',
    body: 'Watering slips when everything else in life gets busy, even for owners who genuinely care.',
    Icon: ClockIcon,
  },
  {
    title: 'Care depends on one person',
    body: "Plant care is a solo task. When you're busy or away from home, your plants get no attention from anyone.",
    Icon: HandHeartIcon,
  },
  {
    title: 'Tools stop at information',
    body: 'Care apps tell you how often to water. Social media turns plants into pretty photos. Neither helps keep them alive.',
    Icon: BookIcon,
  },
]

function Problem() {
  return (
    <section id="why" className="scroll-mt-4 bg-paper">
      <div className="mx-auto flex max-w-page flex-col items-center gap-14 py-20 px-page lg:py-[120px]">
        <SectionHeader
          eyebrow="Why myPlunt"
          title="Most plants don't die from a lack of love."
          subtitle="They die in the busy weeks. Plenty of new plant owners genuinely care, but when work, study or a trip takes over, nobody else is there to pick up the watering can."
        />

        <div className="grid w-full gap-6 md:grid-cols-3">
          {problems.map(({ title, body, Icon }) => (
            <article
              key={title}
              className="flex flex-col items-start gap-4 rounded-3xl border-[1.5px] border-sand bg-white px-8 pt-8 pb-9"
            >
              <div className="flex size-14 items-center justify-center rounded-2xl bg-cream text-soil">
                <Icon width={28} height={28} />
              </div>
              <h3 className="font-primary text-[34px] leading-none font-semibold">{title}</h3>
              <p className="text-lg leading-[1.55] text-ink">{body}</p>
            </article>
          ))}
        </div>

        <div className="flex w-full flex-col items-start gap-5 rounded-[20px] bg-green px-6 py-7 sm:flex-row sm:items-center sm:px-10">
          <div className="shrink-0 rounded-[14px] bg-cream p-2">
            <img src={logoMyPlunt} alt="" width={38.3673} height={40} className="h-10 w-[38.3673px]" />
          </div>
          <p className="max-w-[1000px] font-primary text-[31px] leading-[1.1] font-semibold text-cream sm:text-[34px]">
            myPlunt turns plant care into a shared effort instead of a solo responsibility, so friends help each
            other keep their plants alive.
          </p>
        </div>
      </div>
    </section>
  )
}

export default Problem
