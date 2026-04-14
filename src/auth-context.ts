import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'

export type AuthContextValue = {
  isReady: boolean
  isFirebaseEnabled: boolean
  user: User | null
  isAdmin: boolean
  signInWithGoogle: () => Promise<void>
  signOutFromGoogle: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
