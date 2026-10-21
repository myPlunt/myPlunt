import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'

import { useAuth } from './auth/auth-context'
import AppLayout from './components/AppLayout'
import LoginPage from './components/LoginPage'
import OverviewPage from './pages/OverviewPage'
import SpeciesPage from './pages/SpeciesPage'

// Loaded on first visit: its chart library is most of the bundle.
const LogsPage = lazy(() => import('./pages/LogsPage'))

function App() {
  const { state, signOut } = useAuth()

  // Checking for an existing session; brief, and nothing worth showing.
  if (state.status === 'loading') return null
  // Shown on any URL, so after logging in the admin lands on the page they opened.
  if (state.status === 'signedOut') return <LoginPage />

  return (
    <Routes>
      <Route element={<AppLayout admin={state.admin} onSignOut={signOut} />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="species" element={<SpeciesPage />} />
        <Route
          path="logs"
          element={
            <Suspense>
              <LogsPage />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Route>
    </Routes>
  )
}

export default App
