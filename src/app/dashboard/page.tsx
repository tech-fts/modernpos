'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { formatRelativeTime } from '@/lib/utils'
import { useSettings } from '@/contexts/SettingsContext'
import { LoadingSpinner, Card, ErrorMessageCard } from '@/components/ui'
import { useSmartDataFetching } from '@/hooks'
import { type DashboardApiResponse, type DashboardStats, type DashboardRecentSale } from '@/types/dashboard'
import { getDashboardStats } from '@/actions/dashboard'

import QuickSearch from '@/components/QuickSearch'
import CurrencySelector from '@/components/CurrencySelector'
import LowStockAlert from '@/components/LowStockAlert'

import {
  PlusIcon,
  ShoppingCartIcon,
  CubeIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  TagIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { addNotification } = useNotifications()
  const { formatCurrency } = useCurrency()
  const { settings } = useSettings()

  // Use the smart data fetching hook with caching
  const { 
    data: dashboardData, 
    loading, 
    error,
    refetch: fetchDashboardStats
  } = useSmartDataFetching<DashboardApiResponse>({
    cacheKey: 'dashboard:stats',
    fetcher: ({ signal }) => getDashboardStats(signal),
    autoFetch: !authLoading && !!user && user.role !== 'ADMIN',
    cacheDuration: 60000, // Cache for 1 minute
    debounceDelay: 500, // Debounce API calls
    onError: () => {
      addNotification({
        type: 'error',
        title: 'Dashboard Error',
        message: 'Failed to load dashboard statistics. Some data may be outdated.',
        duration: 5000
      })
    }
  })

  // Transform API data to stats
  const stats: DashboardStats = {
    todaySales: dashboardData?.today?.revenue || 0,
    totalProducts: dashboardData?.totals?.products || 0,
    totalCustomers: dashboardData?.totals?.customers || 0,
    totalCategories: dashboardData?.totals?.categories || 0,
    lowStockProducts: dashboardData?.lowStockCount || 0
  }
  const recentSales = dashboardData?.recentSales || []

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (!authLoading && user?.role === 'ADMIN') {
      router.push('/dashboard/admin')
    }
  }, [user, authLoading, router])

  // Smart data fetching already handles caching and prevents excessive refreshes
  // No need for visibility change handler as the hook manages this automatically

  // Show loading state while checking auth
  if (authLoading) {
    return <LoadingSpinner />
  }

  // Show redirect message for admin users
  if (user?.role === 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <ShieldCheckIcon className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Redirecting to Admin Dashboard</h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      name: 'New Sale',
      href: '/dashboard/sales/new',
      icon: ShoppingCartIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Start a new transaction'
    },
    {
      name: 'Add Product',
      href: '/dashboard/products/new',
      icon: PlusIcon,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Add new product to inventory'
    },
    {
      name: 'Manage Categories',
      href: '/dashboard/categories',
      icon: TagIcon,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      description: 'Organize product categories'
    },
    {
      name: 'New Category',
      href: '/dashboard/categories/new',
      icon: PlusIcon,
      color: 'bg-teal-500 hover:bg-teal-600',
      description: 'Create new product category'
    },
    {
      name: 'View Reports',
      href: '/dashboard/reports',
      icon: ChartBarIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Check sales analytics'
    },
    {
      name: 'Manage Stock',
      href: '/dashboard/products',
      icon: CubeIcon,
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'Update product inventory'
    }
  ]

  const renderPaymentStatus = (status?: DashboardRecentSale['payment_status']) => {
    if (!status) return null
    const styles: Record<NonNullable<DashboardRecentSale['payment_status']>, string> = {
      PAID: 'bg-green-100 text-green-800',
      NOT_PAID: 'bg-red-100 text-red-800',
      CASH_ON_DELIVERY: 'bg-amber-100 text-amber-800'
    }
    const labels: Record<NonNullable<DashboardRecentSale['payment_status']>, string> = {
      PAID: 'Paid',
      NOT_PAID: 'Not Paid',
      CASH_ON_DELIVERY: 'Cash on Delivery'
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] xs:text-xs font-semibold ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl xs:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 xs:mt-2 text-xs xs:text-sm text-gray-700">
            Welcome back! Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
        
        <div className="mt-3 xs:mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 xs:space-y-3 sm:space-y-0 sm:space-x-2 md:space-x-3">
          {/* Mobile S (320px) - Three column layout with long press text */}
          <div className="grid grid-cols-3 gap-1.5 sm:hidden">
            <div className="flex justify-center">
              <button
            onClick={fetchDashboardStats}
            disabled={loading}
            className="group relative inline-flex items-center justify-center p-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-500"></div>
            ) : (
              <ArrowPathIcon className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        <div className="flex justify-center">
          <Link
            href="/dashboard/sales/new"
                className="group relative inline-flex items-center justify-center px-2.5 py-1.5 border border-transparent rounded-md shadow-sm text-[10px] font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ShoppingCartIcon className="h-3.5 w-3.5" />
                {/* Long press text overlay */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  New Sale
                </div>
              </Link>
            </div>
            <div className="flex justify-center">
              <div className="flex-shrink-0">
                <CurrencySelector />
              </div>
            </div>
          </div>
          
          {/* Tablet (768px) - Medium buttons with refresh icon from reports */}
          <div className="hidden sm:flex md:hidden items-center space-x-2">
            <button
              onClick={fetchDashboardStats}
              disabled={loading}
              className="group relative inline-flex items-center justify-center p-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              ) : (
                <ArrowPathIcon className="h-4 w-4" />
              )}
            </button>
            <Link
              href="/dashboard/sales/new"
              className="group relative inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <ShoppingCartIcon className="h-4 w-4" />
              {/* Hover tooltip for tablet */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Create New Sale
              </div>
            </Link>
            <div className="flex-shrink-0">
              <CurrencySelector />
            </div>
          </div>
          
          {/* Desktop (1024px+) - Full buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={fetchDashboardStats}
              disabled={loading}
              className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
            <Link
              href="/dashboard/sales/new"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <ShoppingCartIcon className="h-4 w-4" />
            </Link>
            <div className="flex-shrink-0">
              <CurrencySelector />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Search */}
      <div className="w-full max-w-lg">
        <QuickSearch />
      </div>

      {/* Low Stock Alert */}
      {user && <LowStockAlert />}

      {/* Error Message */}
      {error && <ErrorMessageCard message={error} />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-3 xs:gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="p-3 xs:p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-5 w-5 xs:h-6 xs:w-6 text-green-400" />
              </div>
              <div className="ml-3 xs:ml-4 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs xs:text-sm font-medium text-gray-500 truncate">Today&apos;s Sales</dt>
                  <dd className="text-base xs:text-lg font-medium text-gray-900">{formatCurrency(stats.todaySales)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-3 xs:p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CubeIcon className="h-5 w-5 xs:h-6 xs:w-6 text-blue-400" />
              </div>
              <div className="ml-3 xs:ml-4 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs xs:text-sm font-medium text-gray-500 truncate">Total Products</dt>
                  <dd className="text-base xs:text-lg font-medium text-gray-900">{stats.totalProducts}</dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-3 xs:p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-5 w-5 xs:h-6 xs:w-6 text-purple-400" />
              </div>
              <div className="ml-3 xs:ml-4 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs xs:text-sm font-medium text-gray-500 truncate">Customers</dt>
                  <dd className="text-base xs:text-lg font-medium text-gray-900">{stats.totalCustomers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-3 xs:p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TagIcon className="h-5 w-5 xs:h-6 xs:w-6 text-indigo-400" />
              </div>
              <div className="ml-3 xs:ml-4 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs xs:text-sm font-medium text-gray-500 truncate">Categories</dt>
                  <dd className="text-base xs:text-lg font-medium text-gray-900">{stats.totalCategories}</dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        {/* Low Stock Alert - Only when enabled */}
        {user && settings.notifications.lowStock && (
          <Card>
            <div className="p-3 xs:p-4 sm:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 xs:h-6 xs:w-6 text-orange-400" />
                </div>
                <div className="ml-3 xs:ml-4 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs xs:text-sm font-medium text-gray-500 truncate">Low Stock</dt>
                    <dd className="text-base xs:text-lg font-medium text-gray-900">{stats.lowStockProducts}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <div className="px-3 xs:px-4 sm:px-6 py-4 xs:py-5 sm:py-6">
          <h3 className="text-base xs:text-lg leading-6 font-medium text-gray-900 mb-3 xs:mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-2 xs:gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="relative group bg-white p-2.5 xs:p-3 sm:p-4 md:p-5 lg:p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div>
                  <span className={`inline-flex p-1.5 xs:p-2 sm:p-2.5 md:p-3 rounded-lg ${action.color} text-white`}>
                    <action.icon className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                  </span>
                </div>
                <div className="mt-1.5 xs:mt-2 sm:mt-3 md:mt-4">
                  <h3 className="text-xs xs:text-sm sm:text-base md:text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    {action.name}
                  </h3>
                  <p className="mt-1 xs:mt-1.5 sm:mt-2 text-[10px] xs:text-xs sm:text-sm text-gray-500">
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card>
        <div className="px-3 xs:px-4 sm:px-6 py-4 xs:py-5 sm:py-6">
          <h3 className="text-base xs:text-lg leading-6 font-medium text-gray-900 mb-3 xs:mb-4">
            Recent Activity
          </h3>
          {recentSales.length === 0 ? (
            <div className="text-center py-6 xs:py-8 text-gray-500">
              <p className="text-sm xs:text-base">No recent activity to display</p>
              <p className="text-xs xs:text-sm mt-1">Start making sales to see activity here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <Link
                  key={sale.id}
                  href={`/dashboard/sales/${sale.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-3 xs:px-4 py-2.5 xs:py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm xs:text-base font-medium text-gray-900 truncate">
                      Sale #{sale.id.slice(-8)}
                    </p>
                    <p className="text-xs xs:text-sm text-gray-500 truncate">
                      {sale.customers?.name || 'Walk-in Customer'}  {formatRelativeTime(new Date(sale.created_at))}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 xs:space-x-3">
                    {renderPaymentStatus(sale.payment_status)}
                    <span className="text-sm xs:text-base font-semibold text-gray-900">
                      {formatCurrency(Number(sale.total))}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
