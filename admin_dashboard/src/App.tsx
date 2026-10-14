import { Navigate, Route, Routes } from 'react-router'

import { useAuth } from './auth/auth-context'
import AppLayout from './components/AppLayout'
import LoginPage from './components/LoginPage'
import LogsPage from './pages/LogsPage'
import OverviewPage from './pages/OverviewPage'
import SpeciesPage from './pages/SpeciesPage'

function App() {
  const { state, signOut } = useAuth()

  // Checking for an existing session; brief, and nothing worth showing.
  if (state.status === 'loading') return null
  // Shown on any URL, so after logging in the admin lands on the page they opened.
  if (state.status === 'signedOut') return <LoginPage />

  return (
    <Routes>
      <Route element={<AppLayout admin={state.admin} onSignOut={signOut} />}>
        <Route index element={<OverviewPage />} />
        <Route path="species" element={<SpeciesPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
