import {
  GoogleAuthProvider,
  type User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from './auth-context'
import { adminEmails, auth } from './firebase'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? ''
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(!auth)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (!auth) {
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setIsReady(true)
    })

    return unsubscribe
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const userEmail = normalizeEmail(user?.email)
    const isAdmin = !!userEmail && adminEmails.includes(userEmail)

    return {
      isReady,
      isFirebaseEnabled: !!auth,
      user,
      isAdmin,
      async signInWithGoogle() {
        if (!auth) {
          throw new Error('Firebase 인증 설정이 비어 있습니다.')
        }

        await signInWithPopup(auth, googleProvider)
      },
      async signOutFromGoogle() {
        if (!auth) {
          return
        }

        await signOut(auth)
      },
    }
  }, [isReady, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
