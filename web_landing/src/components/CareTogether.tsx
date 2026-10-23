import commentNotification from '../assets/notifications/comentnoti.jpg'
import likeNotification from '../assets/notifications/likenoti.jpg'
import newPlantNotification from '../assets/notifications/newplantnoti.jpg'
import answerNotification from '../assets/notifications/questioncomentnoti.jpg'
import feedScreen from '../assets/screens/Feed.jpg'
import LeafShape from './LeafShape'
import NotificationShot from './NotificationShot'
import PhoneMockup from './PhoneMockup'
import SectionHeader from './SectionHeader'

function CareTogetherVisual() {
  return (
    <div className="relative h-[429px] w-[338px] shrink-0 sm:h-[660px] sm:w-[520px]">
      <div className="absolute top-0 left-0 h-[660px] w-[520px] origin-top-left scale-[0.65] sm:scale-100">
        <LeafShape direction="right" tone="leaf" className="absolute top-[150px] left-[-70px] size-[380px] rotate-15" />
        <LeafShape direction="left" tone="leaf" className="absolute top-15 left-[200px] size-[360px] rotate-350" />
        <PhoneMockup size={300} screen={feedScreen} className="absolute top-5 left-[110px]" />
      </div>
    </div>
  )
}

function CareTogether() {
  return (
    <section className="overflow-x-clip bg-cream">
      <div className="mx-auto flex max-w-page flex-col items-center gap-12 py-20 px-page xl:flex-row xl:justify-between xl:py-[120px]">
        <div className="flex w-full max-w-[540px] flex-col items-start gap-7">
          <SectionHeader
            align="left"
            eyebrow="Care together"
            title="You don't have to keep them alive alone."
            subtitle="Add friends as backup for when life gets busy. The feed isn't just photos: it tells you what is happening to the plants you care about, so you can step in when someone needs a hand."
          />

          <ul className="flex w-full flex-col gap-3">
            <li>
              <NotificationShot
                src={newPlantNotification}
                alt="A new plant: Laura just showed her new plant"
                cropTop={32}
                cropHeight={183}
                className="w-[380px] max-w-full rounded-3xl"
              />
            </li>
            <li>
              <NotificationShot
                src={likeNotification}
                alt="New like: egidijus liked your photo of Vera."
                cropTop={24}
                cropHeight={183}
                className="w-[380px] max-w-full rounded-3xl"
              />
            </li>
            <li>
              <NotificationShot
                src={commentNotification}
                alt='New comment: egidijus commented on Vera: "Nice plant"'
                cropTop={27}
                cropHeight={223}
                className="w-[380px] max-w-full rounded-3xl"
              />
            </li>
            <li>
              <NotificationShot
                src={answerNotification}
                alt="New answer: Rafael just answered your question"
                cropTop={37}
                cropHeight={185}
                className="w-[380px] max-w-full rounded-3xl"
              />
            </li>
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
