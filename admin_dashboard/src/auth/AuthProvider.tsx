import { useEffect, useState, type ReactNode } from 'react'

import { login, logout, onSessionEnded, refreshSession } from '../lib/api'
import { AuthContext, type AuthState } from './auth-context'

function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    onSessionEnded(() => setState({ status: 'signedOut' }))
    refreshSession()
      .then((admin) => setState(admin ? { status: 'signedIn', admin } : { status: 'signedOut' }))
      .catch(() => setState({ status: 'signedOut' }))
  }, [])

  async function signIn(email: string, password: string) {
    const admin = await login(email, password)
    setState({ status: 'signedIn', admin })
  }

  async function signOut() {
    try {
      await logout()
    } finally {
      setState({ status: 'signedOut' })
    }
  }

  return <AuthContext.Provider value={{ state, signIn, signOut }}>{children}</AuthContext.Provider>
}

export default AuthProvider
