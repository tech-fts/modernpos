'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AuthErrorBoundary } from '@/components/AuthErrorBoundary'
import useAuthRedirect from '@/hooks/useAuthRedirect'
import { type DashboardLayoutProps } from '@/types/layout'

import { 
  HomeIcon, 
  ShoppingCartIcon, 
  CubeIcon, 
  ChartBarIcon,
  UserGroupIcon,
  TagIcon,
  UsersIcon,
  CogIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  
  // Redirect to login if not authenticated
  useAuthRedirect({ requireAuth: true, redirectTo: '/login' })
  
  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything while redirecting
  if (!user) {
    return null
  }
  
  // Define navigation items with role restrictions
  const allNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['USER', 'MANAGER'] },
    { name: 'Admin Dashboard', href: '/dashboard/admin', icon: ShieldCheckIcon, roles: ['ADMIN'] },
    { name: 'Sales', href: '/dashboard/sales', icon: ShoppingCartIcon, roles: ['USER', 'MANAGER'] },
    { name: 'Products', href: '/dashboard/products', icon: CubeIcon, roles: ['USER', 'MANAGER'] },
    { name: 'Categories', href: '/dashboard/categories', icon: TagIcon, roles: ['USER', 'MANAGER'] },
    { name: 'Reports', href: '/dashboard/reports', icon: ChartBarIcon, roles: ['USER', 'MANAGER'] },
    { name: 'Customers', href: '/dashboard/customers', icon: UserGroupIcon, roles: ['USER', 'MANAGER'] },
    { name: 'Users', href: '/dashboard/users', icon: UsersIcon, roles: ['ADMIN'] },
    { name: 'Settings', href: '/dashboard/settings', icon: CogIcon, roles: ['ADMIN', 'USER', 'MANAGER'] },
  ]

  // Filter navigation based on user role
  const navigation = allNavigation.filter(item => 
    item.roles.includes(user.role || 'USER')
  )

  return (
    <AuthErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Navigation */}
        <div className="lg:hidden">
        <div className="mobile-nav-container fixed bottom-0 left-0 right-0 z-50 shadow-lg">
          <nav className="flex justify-around py-2 xs:py-2.5 md:py-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={item.name}
                  className={`group relative mobile-nav-item flex flex-col items-center py-1.5 xs:py-2 md:py-2 px-1.5 xs:px-2 md:px-3 text-xs xs:text-xs md:text-sm transition-colors duration-200 min-w-0 flex-1 ${
                    isActive 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <item.icon className={`icon h-4 w-4 xs:h-5 xs:w-5 md:h-6 md:w-6 mb-1 xs:mb-1.5 md:mb-1 ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  <span className="hidden md:block text-xs xs:text-xs md:text-sm font-medium truncate max-w-full text-center leading-tight">{item.name}</span>
                  
                  {/* Hover tooltip for mobile S (320px) - only show on small screens */}
                  <div className="md:hidden absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {item.name}
                  </div>
                </Link>
              )
            })}
            

          </nav>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-gray-900">Modern POS</h1>
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <item.icon className="mr-3 h-6 w-6" />
                {item.name}
              </Link>
            ))}
          </nav>

        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="flex-1">
          <div className="py-3 xs:py-4 md:py-5 sm:py-6">
            <div className="max-w-7xl mx-auto px-3 xs:px-4 md:px-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Content Padding */}
      <div className="lg:hidden pb-16 xs:pb-18 md:pb-20 sm:pb-20" />
    </div>
    </AuthErrorBoundary>
  )
}
