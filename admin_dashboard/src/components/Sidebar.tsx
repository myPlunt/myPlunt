import { NavLink } from 'react-router'

import logoMyPlunt from '../assets/logo-myplunt.svg'
import type { Admin } from '../lib/api'

const links = [
  { label: 'Species', to: '/species' },
  { label: 'Logs', to: '/logs' },
]

type SidebarProps = {
  admin: Admin
  onSignOut: () => void
}

function Sidebar({ admin, onSignOut }: SidebarProps) {
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
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) =>
              `rounded-xl px-4 py-2.5 text-[15px] font-semibold transition-colors ${isActive ? 'bg-green text-white' : 'hover:bg-sand'}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-3 md:mt-auto">
        <div className="flex flex-col">
          <span className="text-[15px] font-semibold">{admin.displayName}</span>
          <span className="text-sm break-all text-ink">{admin.email}</span>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="self-start rounded-full border border-green px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
        >
          Log out
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
