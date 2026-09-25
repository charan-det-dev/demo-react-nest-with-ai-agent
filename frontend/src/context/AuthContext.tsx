// AuthContext: holds the current JWT + decoded User, persists the token to
// localStorage, and exposes login/logout (per Tasks.md > Frontend > Auth state).

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AUTH_TOKEN_STORAGE_KEY } from '../api/client'

export type CurrentUser = {
  email?: string
  sub?: string
}

type AuthContextValue = {
  token: string | null
  user: CurrentUser | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Best-effort decode of the JWT payload for display purposes only (e.g. the
 * User's email on the Home page). This does NOT verify the signature — that
 * is the backend's job on every request; the frontend only reads the claims
 * it was handed back.
 */
function decodeUser(token: string): CurrentUser | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const claims = JSON.parse(json) as { email?: string; sub?: string; exp?: number }
    if (claims.exp && claims.exp * 1000 < Date.now()) return null
    return { email: claims.email, sub: claims.sub }
  } catch {
    return null
  }
}

function readStoredToken(): { token: string | null; user: CurrentUser | null } {
  let stored: string | null = null
  try {
    stored = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  } catch {
    stored = null
  }
  if (!stored) return { token: null, user: null }

  const user = decodeUser(stored)
  if (!user) {
    // Token missing, malformed, or expired: don't hang on to it.
    try {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    } catch {
      /* ignore */
    }
    return { token: null, user: null }
  }
  return { token: stored, user }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [{ token, user }, setState] = useState(readStoredToken)

  const login = useCallback((newToken: string) => {
    try {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, newToken)
    } catch {
      /* localStorage unavailable (private mode, etc.) — session stays in-memory only */
    }
    setState({ token: newToken, user: decodeUser(newToken) })
  }, [])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    } catch {
      /* ignore */
    }
    setState({ token: null, user: null })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, isAuthenticated: token !== null, login, logout }),
    [token, user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth ต้องถูกเรียกภายใน <AuthProvider>')
  return ctx
}
