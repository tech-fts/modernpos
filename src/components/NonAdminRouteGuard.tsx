'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import useAuthRedirect from '@/hooks/useAuthRedirect'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'

interface NonAdminRouteGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function NonAdminRouteGuard({ children, fallback }: NonAdminRouteGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useAuthRedirect({
    denyRoles: ['ADMIN'],
    redirectTo: '/dashboard'
  })

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Show access denied for admin users
  if (user?.role === 'ADMIN') {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <ShieldCheckIcon className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Admin Access Restricted</h2>
          <p className="text-gray-600">This page is for regular users and managers only.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Render content for non-admin users
  return <>{children}</>
}
