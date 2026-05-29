'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { type AuthUser } from '@/types/auth'
import { getCurrentUser, login as loginAction, logout as logoutAction } from '@/actions/auth'

interface UseSmartAuthReturn {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  refreshUser: () => Promise<void>
}

// Global auth state to prevent duplicate auth checks
let globalAuthState: {
  user: AuthUser | null
  loading: boolean
  lastCheck: number
} = {
  user: null,
  loading: false,
  lastCheck: 0
}

// Auth check cooldown (5 seconds)
const AUTH_CHECK_COOLDOWN = 5000

function useSmartAuth(): UseSmartAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(globalAuthState.user)
  const [loading, setLoading] = useState(globalAuthState.loading)
  const router = useRouter()
  const abortControllerRef = useRef<AbortController | null>(null)

  const isAuthenticated = !!user

  // Check if we should skip auth check (cooldown period)
  const shouldSkipAuthCheck = useCallback((): boolean => {
    const now = Date.now()
    return now - globalAuthState.lastCheck < AUTH_CHECK_COOLDOWN
  }, [])

  // Update global auth state
  const updateGlobalAuthState = useCallback((updates: Partial<typeof globalAuthState>) => {
    globalAuthState = { ...globalAuthState, ...updates }
  }, [])

  // Check authentication status
  const checkAuth = useCallback(async (): Promise<void> => {
    // Skip if already loading or within cooldown period
    if (globalAuthState.loading || shouldSkipAuthCheck()) {
      return
    }

    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    
    updateGlobalAuthState({ loading: true })
    setLoading(true)

    try {
      const userInfo = await getCurrentUser(abortControllerRef.current.signal)

      if (userInfo) {
        // Cache user data in localStorage to prevent flash on reload
        try {
          localStorage.setItem('cached-user', JSON.stringify({
            user: userInfo,
            timestamp: Date.now()
          }))
        } catch {
          // Ignore localStorage errors
        }
        
        updateGlobalAuthState({ 
          user: userInfo, 
          loading: false, 
          lastCheck: Date.now() 
        })
        setUser(userInfo)
      } else {
        try {
          localStorage.removeItem('cached-user')
        } catch {
          // Ignore localStorage errors
        }

        updateGlobalAuthState({ 
          user: null, 
          loading: false, 
          lastCheck: Date.now() 
        })
        setUser(null)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      
      console.error('Auth check error:', error)
      updateGlobalAuthState({ 
        user: null, 
        loading: false, 
        lastCheck: Date.now() 
      })
      setUser(null)
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [updateGlobalAuthState, shouldSkipAuthCheck])

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const userInfo = await loginAction(email, password)

      // Cache user data in localStorage to prevent flash on reload
      try {
        localStorage.setItem('cached-user', JSON.stringify({
          user: userInfo,
          timestamp: Date.now()
        }))
      } catch {
        // Ignore localStorage errors
      }

      // Update both local and global state
      updateGlobalAuthState({ 
        user: userInfo, 
        loading: false, 
        lastCheck: Date.now() 
      })
      setUser(userInfo)

      // Clear any cached data to ensure fresh data
      if (typeof window !== 'undefined' && window.clearAllCaches) {
        window.clearAllCaches()
      }

      return true
    } catch (error) {
      console.error('❌ Login error:', error)
      return false
    }
  }, [updateGlobalAuthState])

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutAction()
    } catch (error) {
      console.error('❌ Logout error:', error)
    } finally {
      // Always clear state and redirect, even if logout fails
      updateGlobalAuthState({ 
        user: null, 
        loading: false, 
        lastCheck: Date.now() 
      })
      setUser(null)
      
      // Clear cached user data
      try {
        localStorage.removeItem('cached-user')
      } catch {
        // Ignore localStorage errors
      }
      
      // Clear all caches
      if (typeof window !== 'undefined' && window.clearAllCaches) {
        window.clearAllCaches()
      }
      
      router.push('/login')
    }
  }, [updateGlobalAuthState, router])

  // Refresh user data (force refresh)
  const refreshUser = useCallback(async (): Promise<void> => {
    // Force refresh by clearing cooldown
    updateGlobalAuthState({ lastCheck: 0 })
    await checkAuth()
  }, [checkAuth, updateGlobalAuthState])

  // Initialize auth state
  useEffect(() => {
    // If we have cached user data, use it immediately
    if (globalAuthState.user && !user) {
      setUser(globalAuthState.user)
      setLoading(false)
    }
    
    // Check if we have cached auth data in localStorage to prevent flash
    const checkCachedAuth = () => {
      try {
        const cachedUser = localStorage.getItem('cached-user')
        if (cachedUser && !globalAuthState.user) {
          const userData = JSON.parse(cachedUser)
          // Only use cached data if it's recent (less than 1 hour old)
          if (userData.timestamp && Date.now() - userData.timestamp < 3600000) {
            updateGlobalAuthState({ 
              user: userData.user, 
              loading: false, 
              lastCheck: Date.now() 
            })
            setUser(userData.user)
            setLoading(false)
            return
          }
        }
      } catch {
        // Clear invalid cached data
        localStorage.removeItem('cached-user')
      }
      
      // Check auth if needed
      if (!globalAuthState.user && !shouldSkipAuthCheck()) {
        checkAuth()
      }
    }
    
    checkCachedAuth()
  }, [checkAuth, shouldSkipAuthCheck, user, updateGlobalAuthState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    refreshUser
  }
}

// Utility function to get current auth state
export const getCurrentAuthState = () => ({ ...globalAuthState })

// Utility function to clear auth state (useful for testing)
export const clearAuthState = () => {
  globalAuthState = {
    user: null,
    loading: false,
    lastCheck: 0
  }
}

export default useSmartAuth
