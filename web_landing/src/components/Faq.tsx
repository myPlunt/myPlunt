import QuestionMarkIcon from '../assets/icons/question-mark.svg?react'
import SectionHeader from './SectionHeader'

const questions = [
  {
    question: 'Is myPlunt free?',
    answer: 'Yes, myPlunt is free to download on the App Store and Google Play.',
  },
  {
    question: "What happens to my plants when I'm on holiday?",
    answer:
      "Hand the keys to a trusted friend. They receive your plants' reminders while you're away, and you can see every watering.",
  },
  {
    question: 'How do the weather alerts work?',
    answer: 'Each plant has its own location, so alerts are based on the weather where that plant actually lives.',
  },
  {
    question: 'What is the Plantdex?',
    answer: 'A guide to regional plants that grow well where you live, so you can discover them before you bring them home.',
  },
  {
    question: 'What happens when a plant dies?',
    answer: 'It finds its place in the community cemetery, so its story is remembered instead of deleted.',
  },
]

function Faq() {
  return (
    <section id="faq" className="scroll-mt-4 bg-cream">
      <div className="mx-auto flex max-w-page flex-col items-center gap-12 py-20 px-page lg:py-[120px]">
        <SectionHeader eyebrow="FAQ" title="Questions, answered." />

        <dl className="flex w-full max-w-[840px] flex-col gap-4">
          {questions.map(({ question, answer }) => (
            <div
              key={question}
              className="flex gap-4 rounded-2xl border-[1.5px] border-sand bg-white p-6 shadow-card sm:gap-5 sm:p-8"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-leaf/14 text-leaf">
                <QuestionMarkIcon width={26} height={26} aria-hidden />
              </span>
              <div className="flex flex-col gap-2 pt-1">
                <dt className="font-primary text-[29px] leading-none font-semibold">{question}</dt>
                <dd className="text-[17px] leading-[1.55] text-ink">{answer}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export default Faq
