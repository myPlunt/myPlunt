import logoMyPlunt from '../assets/logo-myplunt.svg'

const links = [
  { label: 'Why myPlunt', href: '#why' },
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
]

function Navigation() {
  return (
    <header className="mx-auto flex max-w-page items-center justify-between gap-6 bg-cream py-5 px-page md:py-7">
      <a className="flex shrink-0 items-center gap-3" href="#top" aria-label="myPlunt home">
        <img src={logoMyPlunt} alt="" width={42.2041} height={44} />
        <span className="font-primary text-[30px] leading-none font-semibold whitespace-nowrap text-green min-[401px]:text-[36px]">
          myPlunt
        </span>
      </a>


      {/* No mobile design yet: section links are hidden on small screens. */}
      {/* TODO: Add mobile design for small screens. */}
      <nav className="hidden gap-10 text-base font-medium whitespace-nowrap lg:flex" aria-label="Main">
        {links.map((link) => (
          <a key={link.href} href={link.href} className="hover:underline hover:underline-offset-4">
            {link.label}
          </a>
        ))}
      </nav>

      <a
        className="shrink-0 rounded-full bg-green px-[18px] py-3 text-[15px] font-semibold whitespace-nowrap text-white transition-opacity hover:opacity-90 min-[401px]:px-6 min-[401px]:py-3.5 min-[401px]:text-base"
        href="#download"
      >
        Get the app
      </a>
    </header>
  )
}

export default Navigation
