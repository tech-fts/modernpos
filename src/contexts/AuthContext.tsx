'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useSmartAuth } from '@/hooks'
import { type AuthUser } from '@/types/auth'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    user,
    loading,
    login,
    logout,
    checkAuth,
    refreshUser
  } = useSmartAuth()

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
