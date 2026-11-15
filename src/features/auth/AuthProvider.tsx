// @author  veera
// @file    features/auth/AuthProvider.tsx
//
// Holds the access token + the current `me` profile in a context.
// On mount it tries to silently refresh from the cookie, so a returning user
// stays signed in.

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import api, { onUnauthorized, setAccessToken } from '@/api/client'
import * as authApi from './api'
import type { UserMe } from '@/types/models'

interface AuthContextValue {
  user: UserMe | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<UserMe>
  signOut: () => Promise<void>
  setUser: (u: UserMe | null) => void
  applyAccess: (token: string, user: UserMe) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserMe | null>(null)
  const [loading, setLoading] = useState(true)

  const applyAccess = useCallback((token: string, u: UserMe) => {
    setAccessToken(token)
    setUser(u)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const r = await authApi.login({ email, password })
    applyAccess(r.access_token, r.user)
    return r.user
  }, [applyAccess])

  const signOut = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    setAccessToken(null)
    setUser(null)
  }, [])

  // Try silent refresh on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await authApi.refresh()
        if (!cancelled) applyAccess(r.access_token, r.user)
      } catch {
        if (!cancelled) {
          setAccessToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [applyAccess])

  // 401 from any other endpoint → boot to login
  useEffect(() => {
    onUnauthorized(() => setUser(null))
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, setUser, applyAccess }}>
      {children}
    </AuthContext.Provider>
  )
}


export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
