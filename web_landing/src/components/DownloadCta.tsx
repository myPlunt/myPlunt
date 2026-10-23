import logoMyPlunt from '../assets/logo-myplunt.svg'
import StoreBadges from './StoreBadges'

function DownloadCta() {
  return (
    <section id="download" className="scroll-mt-4 bg-sand">
      <div className="mx-auto max-w-page pt-16 pb-20 px-page lg:pt-24 lg:pb-[120px]">
        <div className="flex flex-col items-start gap-10 rounded-[32px] bg-green p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between lg:p-[72px]">
          <div className="flex flex-col items-start gap-6">
            <h2 className="max-w-[640px] font-primary text-[48px] leading-[0.95] font-semibold text-cream sm:text-[70px]">
              Give your plants a better chance.
            </h2>
            <p className="max-w-[540px] text-lg leading-[1.55] text-cream/85 sm:text-[19px]">
              Download myPlunt, add your first plant and invite a friend as backup. Your plants will thank you.
            </p>
            <StoreBadges />
          </div>

          <div className="hidden size-[300px] shrink-0 items-center justify-center rounded-[64px] bg-sand lg:flex">
            <img src={logoMyPlunt} alt="" width={182.245} height={190} className="h-[190px] w-[182.245px]" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default DownloadCta
