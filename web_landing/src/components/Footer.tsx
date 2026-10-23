import logoMyPlunt from '../assets/logo-myplunt.svg'

const links = [
  { label: 'Why myPlunt', href: '#why' },
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Download', href: '#download' },
]

function Footer() {
  return (
    <footer className="bg-green text-cream">
      <div className="mx-auto flex max-w-page flex-col gap-10 pt-14 pb-10 px-page">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-start gap-3">
            <a href="#top" className="flex items-center gap-3" aria-label="myPlunt home">
              <span className="rounded-xl bg-sand p-1.5">
                <img src={logoMyPlunt} alt="" width={34.531} height={36} className="h-9 w-[34.531px]" />
              </span>
              <span className="font-primary text-[36px] leading-none font-semibold">myPlunt</span>
            </a>
            <p className="text-[15px] leading-[1.55] text-cream/70">
              Plant care that doesn't depend on just one person.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-8 gap-y-3 sm:flex sm:flex-wrap" aria-label="Footer">
            {links.map(({ label, href }) => (
              <a key={label} href={href} className="text-[15px] whitespace-nowrap text-cream/80 hover:text-cream">
                {label}
              </a>
            ))}
          </nav>
        </div>

        <div className="h-px w-full bg-cream/15" />

        <div className="flex flex-col justify-between gap-4 text-sm text-cream/60 sm:flex-row">
          <p>© {new Date().getFullYear()} myPlunt. All rights reserved.</p>
          <p>Made by Rafael Tavares &amp; Egidijus Ukrinas</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
