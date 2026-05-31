'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'
import { login as loginService, register as registerService, logout as logoutService, getMe } from '@/services/auth-service'
import type { User } from '@/types/user'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (data: {
    firstName: string
    lastName: string
    email: string
    password: string
    phone?: string
    acceptedTerms: boolean
    acceptedPrivacy: boolean
    legalVersion?: string
    marketingConsent?: boolean
  }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const decoded = jwtDecode<{ exp?: number }>(token)
        // Verificar expiración
        if (!decoded.exp || decoded.exp * 1000 < Date.now()) {
          logoutService()
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setLoading(false)
          return
        }
        // Cargar usuario desde API
        getMe()
          .then(setUser)
          .catch(() => logoutService())
          .finally(() => setLoading(false))
      } catch {
        logoutService()
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await loginService(email, password)
    setUser(res.user)
    return res.user
  }

  const register = async (data: Parameters<typeof registerService>[0]) => {
    const res = await registerService(data)
    setUser(res.user)
  }

  const logout = () => {
    logoutService()
    setUser(null)
  }

  const refreshUser = async () => {
    const updated = await getMe()
    setUser(updated)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
