import keyNotification from '../assets/notifications/keynoti.jpg'
import frostNotification from '../assets/notifications/snownoti.jpg'
import waterNotification from '../assets/notifications/waternoti.jpg'
import feedScreen from '../assets/screens/Feed.jpg'
import pluntDexScreen from '../assets/screens/PluntDex.jpg'
import LeafShape from './LeafShape'
import NotificationShot from './NotificationShot'
import PhoneMockup from './PhoneMockup'
import StoreBadges from './StoreBadges'

function HeroVisual() {
  return (
    <div className="relative h-[370px] w-[347px] shrink-0 sm:h-[660px] sm:w-[620px]">
      <div className="absolute top-0 left-0 h-[660px] w-[620px] origin-top-left scale-[0.56] sm:scale-100">
        <LeafShape direction="right" tone="leaf" className="absolute top-[150px] left-[-50px] size-[350px] rotate-15" />
        <LeafShape direction="left" tone="leaf" className="absolute top-15 left-[320px] size-[400px] rotate-350" />

        <PhoneMockup size={250} screen={pluntDexScreen} className="absolute top-[122px] left-[302px] rotate-6" />
        <PhoneMockup size={290} screen={feedScreen} className="absolute top-[30px] left-[120px]" />

        <NotificationShot
          src={waterNotification}
          alt="Time to water: Your Monstera is thirsty, it's been 7 days."
          cropTop={28}
          cropHeight={187}
          className="absolute w-[250px] rounded-[18px] top-[160px] left-[20px]"
        />
        <NotificationShot
          src={frostNotification}
          alt="Frost today: Bring your Basil inside today."
          cropTop={28}
          cropHeight={187}
          className="absolute w-[250px] rounded-[18px] top-[380px] left-[320px]"
        />
        <NotificationShot
          src={keyNotification}
          alt="Alisa has the keys: She just watered your plants while you're away."
          cropTop={34}
          cropHeight={224}
          className="absolute w-[250px] rounded-[18px] top-[520px] left-[60px]"
        />
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="mx-auto flex max-w-page flex-col overflow-x-clip items-center gap-12 pt-6 pb-20 px-page xl:flex-row xl:justify-between xl:gap-8 xl:pt-10 xl:pb-[104px]">
      <div className="flex w-full flex-col items-start gap-7 xl:w-auto xl:max-w-[600px] xl:flex-1">
        <span className="flex items-center gap-2 rounded-full bg-leaf/14 py-2 pr-4 pl-3.5 text-sm font-semibold">
          <span className="size-2 rounded-full bg-leaf" />
          Plant care app for iOS &amp; Android
        </span>

        <h1 className="font-primary text-[56px] leading-[0.95] font-semibold sm:text-[72px] min-[1440px]:text-[86px]">
          Keep your plants alive, <em className="text-leaf">together.</em>
        </h1>

        <p className="max-w-[540px] text-lg leading-[1.55] text-ink sm:text-xl">
          myPlunt reminds you when to water, warns you before the weather turns and lets a trusted friend take
          over when you're away. Because keeping your plants alive shouldn't depend on just one person.
        </p>

        <StoreBadges />

        <p className="text-sm text-ink">Free to download. For plant lovers who sometimes forget.</p>
      </div>

      <HeroVisual />
    </section>
  )
}

export default Hero
