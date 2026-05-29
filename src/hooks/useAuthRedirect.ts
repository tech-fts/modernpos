'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { type UserRole } from '@/types/user'

interface UseAuthRedirectOptions {
  requireAuth?: boolean
  allowRoles?: UserRole[]
  denyRoles?: UserRole[]
  redirectTo?: string
}

export default function useAuthRedirect({
  requireAuth = false,
  allowRoles,
  denyRoles,
  redirectTo
}: UseAuthRedirectOptions) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (requireAuth && !user) {
      router.push(redirectTo ?? '/login')
      return
    }

    if (user) {
      if (allowRoles && !allowRoles.includes(user.role)) {
        router.push(redirectTo ?? '/dashboard')
        return
      }

      if (denyRoles && denyRoles.includes(user.role)) {
        router.push(redirectTo ?? '/dashboard')
      }
    }
  }, [user, loading, requireAuth, allowRoles, denyRoles, redirectTo, router])
}
