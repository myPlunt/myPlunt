import { createContext, useContext } from 'react'

import type { Admin } from '../lib/api'

export type AuthState = { status: 'loading' } | { status: 'signedOut' } | { status: 'signedIn'; admin: Admin }

type AuthContextValue = {
  state: AuthState
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
