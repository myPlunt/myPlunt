import logoMyPlunt from '../assets/logo-myplunt.svg'

function Sidebar() {
  return (
    <aside className="flex shrink-0 flex-col gap-8 bg-cream px-5 py-6 text-green md:w-64 md:py-8">
      <div className="flex items-center gap-3">
        <img src={logoMyPlunt} alt="" width={34} height={36} />
        <div className="flex flex-col">
          <span className="font-primary text-[32px] leading-none font-semibold">myPlunt</span>
          <span className="text-xs font-semibold tracking-wider text-soil uppercase">Admin</span>
        </div>
      </div>

      <nav className="flex gap-2 md:flex-col" aria-label="Main">
        <a href="#" aria-current="page" className="rounded-xl bg-green px-4 py-2.5 text-[15px] font-semibold text-white">
          Overview
        </a>
      </nav>
    </aside>
  )
}

export default Sidebar
