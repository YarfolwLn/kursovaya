import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'wishlist_user'
const TOKEN_KEY = 'wishlist_token'

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  const value = useMemo(() => ({
    user,
    ready,
    setUser: (u) => {
      setUser(u)
      try {
        if (u) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
          if (u.token) localStorage.setItem(TOKEN_KEY, u.token)
        } else {
          localStorage.removeItem(STORAGE_KEY)
          localStorage.removeItem(TOKEN_KEY)
        }
      } catch {
        // ignore
      }
    },
    logout: () => {
      setUser(null)
      try {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(TOKEN_KEY)
      } catch { /* ignore */ }
    },
  }), [user, ready])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
