import SectionHeader from './SectionHeader'

const steps = [
  {
    title: 'Add your plants',
    body: 'Choose each plant and set where it lives. Care schedules and weather alerts are set up for you.',
  },
  {
    title: 'Stay on top of care',
    body: "Get a reminder when it's time to water and a warning before the weather turns.",
  },
  {
    title: 'Bring in a friend',
    body: "Invite friends as backup, so your plants are covered when you're busy or away.",
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-4 bg-paper">
      <div className="mx-auto flex max-w-page flex-col items-center gap-16 py-20 px-page lg:py-[120px]">
        <SectionHeader eyebrow="How it works" title="Three steps to plants that stay alive." />

        <ol className="grid w-full gap-6 md:grid-cols-3">
          {steps.map(({ title, body }, index) => (
            <li key={title} className="flex flex-col items-start gap-4 rounded-3xl bg-cream px-8 pt-8 pb-9">
              <span className="flex size-14 items-center justify-center rounded-full bg-green font-primary text-[31px] leading-none font-semibold text-cream">
                {index + 1}
              </span>
              <h3 className="font-primary text-[31px] leading-none font-semibold">{title}</h3>
              <p className="text-base leading-[1.55] text-ink">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default HowItWorks
