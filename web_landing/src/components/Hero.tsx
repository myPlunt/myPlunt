import type { ComponentType, SVGProps } from 'react'
import DropIcon from '../assets/icons/drop.svg?react'
import KeyIcon from '../assets/icons/key.svg?react'
import RainIcon from '../assets/icons/rain.svg?react'
import PhoneMockup from './PhoneMockup'
import StoreBadges from './StoreBadges'

type NotificationCardProps = {
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  iconBg: string
  title: string
  body: string
  className: string
}

function NotificationCard({ Icon, iconBg, title, body, className }: NotificationCardProps) {
  return (
    <div
      className={`absolute flex items-center gap-3 rounded-[18px] bg-white py-3.5 pr-5 pl-4 shadow-card ${className}`}
    >
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-full text-white ${iconBg}`}>
        <Icon width={22} height={22} />
      </div>
      <div className="flex w-[220px] flex-col gap-0.5">
        <p className="text-[15px] font-semibold text-green">{title}</p>
        <p className="text-[13px] leading-[1.4] text-ink">{body}</p>
      </div>
    </div>
  )
}

function HeroVisual() {
  return (
    <div className="relative h-[370px] w-[347px] shrink-0 sm:h-[660px] sm:w-[620px]">
      <div className="absolute top-0 left-0 h-[660px] w-[620px] origin-top-left scale-[0.56] sm:scale-100">
        <div className="absolute top-[70px] left-[50px] size-[540px] rounded-full bg-sand" />

        <PhoneMockup size={250} className="absolute top-[122px] left-[302px] rotate-6" />
        <PhoneMockup size={290} className="absolute top-[30px] left-[120px]" />

        <NotificationCard
          Icon={DropIcon}
          iconBg="bg-leaf"
          title="Time to water"
          body="Your Monstera is thirsty. It's been 7 days."
          className="top-[200px] left-[20px]"
        />
        <NotificationCard
          Icon={RainIcon}
          iconBg="bg-green"
          title="Frost tonight"
          body="Bring your Basil inside before 22:00."
          className="top-[420px] left-[340px]"
        />
        <NotificationCard
          Icon={KeyIcon}
          iconBg="bg-soil"
          title="Tom has the keys"
          body="He's watering your plants while you're away."
          className="top-[560px] left-[60px]"
        />
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="mx-auto flex max-w-page flex-col items-center gap-12 pt-6 pb-20 px-page xl:flex-row xl:justify-between xl:gap-8 xl:pt-10 xl:pb-[104px]">
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
