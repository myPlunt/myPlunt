import PhoneMockup from './PhoneMockup'
import SectionHeader from './SectionHeader'

const screens = [
  { title: 'My garden', body: 'Every plant at a glance, with what needs care today.' },
  { title: 'Rainy day', body: 'Your garden changes with the real weather where you are.' },
  { title: 'Plantdex', body: 'Discover regional plants and identify any species with a photo.' },
]

function LivingGarden() {
  return (
    <section className="bg-paper">
      <div className="mx-auto flex max-w-page flex-col items-center gap-[72px] py-20 lg:py-[120px]">
        <div className="px-page">
          <SectionHeader
            eyebrow="Your living garden"
            title="A garden that feels the weather."
            subtitle="Explore your garden and your friends' gardens and watch every plant evolve over time. The visuals shift with the real weather around you, so when it rains outside, your virtual garden feels it too."
          />
        </div>

        {/* Phones sit in a row
        on narrow screens the row scrolls sideways and snaps to each phone. */}
        <ul className="flex w-full snap-x snap-mandatory gap-10 overflow-x-auto px-page pb-12 md:justify-center lg:gap-16">
          {screens.map(({ title, body }) => (
            <li key={title} className="flex shrink-0 snap-center flex-col items-center gap-3">
              <PhoneMockup size={260} className="mb-4" />
              <h3 className="font-primary text-[31px] leading-none font-semibold">{title}</h3>
              <p className="w-[280px] text-center text-base leading-normal text-ink">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default LivingGarden
