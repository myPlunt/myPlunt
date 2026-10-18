import { Outlet } from 'react-router'

import type { Admin } from '../lib/api'
import Sidebar from './Sidebar'

type AppLayoutProps = {
  admin: Admin
  onSignOut: () => void
}

function AppLayout({ admin, onSignOut }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar admin={admin} onSignOut={onSignOut} />
      <main className="flex-1 px-5 py-8 sm:px-10 sm:py-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AppLayout
