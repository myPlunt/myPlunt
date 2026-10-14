import { useAuth } from './auth/auth-context'
import LoginPage from './components/LoginPage'
import Overview from './components/Overview'
import Sidebar from './components/Sidebar'

function App() {
  const { state, signOut } = useAuth()

  // Checking for an existing session; brief, and nothing worth showing.
  if (state.status === 'loading') return null
  if (state.status === 'signedOut') return <LoginPage />

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar admin={state.admin} onSignOut={signOut} />
      <main className="flex-1 px-5 py-8 sm:px-10 sm:py-12">
        <Overview />
      </main>
    </div>
  )
}

export default App
