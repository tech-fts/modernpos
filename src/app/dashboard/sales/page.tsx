'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useAuth } from '@/contexts/AuthContext'
import { formatRelativeTime } from '@/lib/utils'
import { LoadingSpinner, Card, ErrorMessageCard } from '@/components/ui'
import { useSmartDataFetching, useSearch } from '@/hooks'
import { type Sale } from '@/types/sale'
import { listSales, updateSalePaymentStatus } from '@/actions/sales'
import { getErrorMessage } from '@/actions/http'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  UserIcon
} from '@heroicons/react/24/outline'

export default function SalesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { addNotification } = useNotifications()
  const { formatCurrency } = useCurrency()
  const [channelFilter, setChannelFilter] = useState<'all' | Sale['sale_channel']>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | Sale['payment_status']>('all')
  const [updatingSaleId, setUpdatingSaleId] = useState<string | null>(null)

  // Use smart data fetching with caching
  const { 
    data: salesData, 
    loading, 
    error, 
    refetch: fetchSales,
    clearCache
  } = useSmartDataFetching<Sale[]>({
    cacheKey: 'sales:list',
    fetcher: ({ signal }) => listSales(signal),
    autoFetch: !!user && !authLoading,
    cacheDuration: 60000, // Keep cache short so totals refresh quickly
    debounceDelay: 250 // Faster response on refetch
  })

  const sales = salesData || []

  // Use the new search hook
  const { 
    searchTerm, 
    filteredData: filteredSales, 
    handleSearchChange 
  } = useSearch<Sale>({
    data: sales,
    searchFields: ['id'],
    minSearchLength: 1
  })

  // Custom search for sales (customer name and user email)
  const searchFilteredSales = filteredSales.filter(sale => {
    const matchesSearch =
      sale.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.users.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesChannel = channelFilter === 'all' || sale.sale_channel === channelFilter
    const matchesStatus = statusFilter === 'all' || sale.payment_status === statusFilter

    return matchesSearch && matchesChannel && matchesStatus
  })

  // Smart data fetching already handles caching and prevents excessive refreshes
  // No need for visibility change handler as the hook manages this automatically

  const toNumber = (value: Sale['total'] | undefined) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const totalRevenue = sales.reduce((sum, sale) => sum + toNumber(sale.total), 0)
  const totalSales = sales.length
  const totalCost = sales.reduce((sum, sale) => (
    sum + sale.sale_items.reduce((saleSum, item) => (
      saleSum + toNumber(item.products.cost) * item.quantity
    ), 0)
  ), 0)
  const profit = totalRevenue - totalCost
  const formatAmount = (amount: number) => {
    const formatted = formatCurrency(amount)
    if (formatted.endsWith('MMK')) {
      return (
        <>
          {formatted.slice(0, -3)}
          <span className="ml-0.5 text-[10px] xs:text-xs font-semibold text-gray-500">MMK</span>
        </>
      )
    }
    return formatted
  }

  const profitLabel = profit >= 0
    ? <>+{formatAmount(profit)}</>
    : <>-{formatAmount(Math.abs(profit))}</>

  const statsCards = [
    {
      label: 'Total Revenue',
      value: formatAmount(totalRevenue),
      icon: CurrencyDollarIcon,
      iconColor: 'text-green-400',
      valueClass: 'text-gray-900'
    },
    {
      label: 'Total Sales',
      value: String(totalSales),
      icon: ShoppingCartIcon,
      iconColor: 'text-blue-400',
      valueClass: 'text-gray-900'
    },
    {
      label: 'Profit',
      value: profitLabel,
      icon: ArrowTrendingUpIcon,
      iconColor: profit >= 0 ? 'text-green-400' : 'text-red-400',
      valueClass: profit >= 0 ? 'text-green-600' : 'text-red-600'
    }
  ]

  const handlePaymentStatusChange = async (saleId: string, status: Sale['payment_status']) => {
    setUpdatingSaleId(saleId)
    try {
      await updateSalePaymentStatus(saleId, status)
      await fetchSales()
      addNotification({
        type: 'success',
        title: 'Payment Status Updated',
        message: 'Sale payment status has been updated.',
        duration: 3000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: getErrorMessage(error, 'Failed to update payment status'),
        duration: 5000
      })
    } finally {
      setUpdatingSaleId(null)
    }
  }

  const renderPaymentStatusSelect = (sale: Sale) => (
    <select
      value={sale.payment_status}
      onChange={(e) => handlePaymentStatusChange(sale.id, e.target.value as Sale['payment_status'])}
      disabled={updatingSaleId === sale.id}
      className="rounded-md border border-gray-300 bg-white px-1.5 py-1 text-[9px] xs:text-[10px] md:text-[9px] font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
    >
      <option value="PAID">Paid</option>
      <option value="NOT_PAID">Not Paid</option>
      <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
    </select>
  )

  const renderSaleChannelBadge = (channel: Sale['sale_channel']) => {
    const styles: Record<Sale['sale_channel'], string> = {
      ONLINE: 'bg-blue-100 text-blue-800',
      IN_STORE: 'bg-gray-100 text-gray-800'
    }
    const labels: Record<Sale['sale_channel'], string> = {
      ONLINE: 'Online',
      IN_STORE: 'In-store'
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${styles[channel]}`}>
        {labels[channel]}
      </span>
    )
  }

  // Force-refresh when redirected from new sale creation
  useEffect(() => {
    if (authLoading) return
    if (searchParams.get('refresh') === '1') {
      ;(async () => {
        clearCache()
        await fetchSales()
        router.replace('/dashboard/sales')
      })()
    }
  }, [authLoading, searchParams, clearCache, fetchSales, router])

  if (authLoading) {
    return <LoadingSpinner />
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base xs:text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Sales</h1>
          <p className="mt-1 xs:mt-2 text-xs xs:text-sm text-gray-700">
            Track all sales transactions and revenue.
          </p>
        </div>
        <div className="mt-3 xs:mt-4 sm:mt-0">
          <Link
            href="/dashboard/sales/new"
            className="inline-flex items-center px-3 xs:px-3.5 md:px-4 py-2 xs:py-2.5 md:py-3 border border-transparent rounded-md shadow-sm text-xs xs:text-sm md:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ShoppingCartIcon className="h-3 w-3 xs:h-4 xs:w-4" />
          </Link>
        </div>
      </div>

      {/* Search */}
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-2.5 xs:pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 xs:h-5 xs:w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search sales by customer, user, or sale ID..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="block w-full pl-8 xs:pl-10 pr-2.5 xs:pr-3 py-2 xs:py-2.5 sm:py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm xs:text-sm sm:text-base"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as typeof channelFilter)}
              className="block w-full py-2 xs:py-2.5 sm:py-3 px-2.5 xs:px-3 border border-gray-300 rounded-md text-xs xs:text-sm sm:text-base bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Channels</option>
              <option value="IN_STORE">In-store</option>
              <option value="ONLINE">Online</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="block w-full py-2 xs:py-2.5 sm:py-3 px-2.5 xs:px-3 border border-gray-300 rounded-md text-xs xs:text-sm sm:text-base bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="PAID">Paid</option>
              <option value="NOT_PAID">Not Paid</option>
              <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Sales Stats */}
      <div className="grid grid-cols-1 gap-3 xs:gap-4 sm:gap-5 sm:grid-cols-3">
        {statsCards.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className={`h-4 w-4 xs:h-5 xs:w-5 md:h-6 md:w-6 ${stat.iconColor}`} />
              </div>
              <div className="ml-2 xs:ml-3 md:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs xs:text-sm font-medium text-gray-500 truncate">{stat.label}</dt>
                  <dd className={`text-sm xs:text-base md:text-lg font-medium ${stat.valueClass}`}>{stat.value}</dd>
                </dl>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <ErrorMessageCard
          message={error}
          className="border-transparent sm:border-red-200"
        />
      )}

      {/* Sales List */}
      <Card className="overflow-hidden">
        <div className="px-3 xs:px-4 md:px-5 lg:px-6 py-3 xs:py-4 md:py-5 lg:py-6">
          {searchFilteredSales.length === 0 ? (
            <div className="text-center py-6 xs:py-8 md:py-12 lg:py-16">
              <p className="text-xs xs:text-sm md:text-base lg:text-lg text-gray-500">
                {searchTerm ? 'No sales found' : 'No sales yet'}
              </p>
              <p className="text-xs xs:text-xs md:text-sm lg:text-base text-gray-400 mt-1">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first sale to get started'}
              </p>
              {!searchTerm && (
                <div className="mt-4">
                  <Link
                    href="/dashboard/sales/new"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Sale
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 xs:space-y-4 md:space-y-5 lg:space-y-6">
              {searchFilteredSales.map((sale) => (
                <div key={sale.id} className="bg-white border-transparent sm:border sm:border-gray-200 rounded-lg p-3 xs:p-4 md:p-5 lg:p-6 hover:shadow-md transition-shadow">
                  {/* Mobile Layout: Stacked */}
                  <div className="block sm:hidden space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 xs:h-10 xs:w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <ShoppingCartIcon className="h-4 w-4 xs:h-5 xs:w-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm xs:text-base font-medium text-gray-900">
                            <span className="md:hidden lg:inline tablet-hidden">Sale </span>#{sale.id.slice(-8)}
                          </h3>
                          <p className="text-xs xs:text-sm text-gray-500">
                            {sale.customers?.name || 'Walk-in Customer'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm xs:text-base font-bold text-gray-900">
                          {formatCurrency(Number(sale.total))}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center space-x-2">
                          <span>{sale.payment_type}</span>
                          <span aria-hidden="true">•</span>
                          {renderSaleChannelBadge(sale.sale_channel)}
                          <span aria-hidden="true"></span>
                          {renderPaymentStatusSelect(sale)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs xs:text-sm">
                        <span className="text-gray-600">Items:</span>
                        <span className="text-gray-900">{sale.sale_items.length}</span>
                      </div>
                      <div className="hidden lg:flex justify-between text-xs xs:text-sm tablet-hidden">
                        <span className="text-gray-600">Processed by:</span>
                        <span className="text-gray-900">{sale.users.email}</span>
                      </div>
                      <div className="flex justify-between text-xs xs:text-sm">
                        <span className="text-gray-600">Date:</span>
                        <span className="text-gray-900">{formatRelativeTime(new Date(sale.created_at))}</span>
                      </div>
                      {Number(sale.discount) > 0 && (
                        <div className="flex justify-between text-xs xs:text-sm">
                          <span className="text-gray-600">Discount:</span>
                          <span className="text-green-600">{formatCurrency(Number(sale.discount))}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-2 border-t border-transparent sm:border-t sm:border-gray-200">
                      <Link
                        href={`/dashboard/sales/${sale.id}`}
                        className="w-full text-center bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>

                  {/* Tablet/Desktop Layout: Horizontal */}
                  <div className="hidden sm:flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <ShoppingCartIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <h3 className="text-base font-medium text-gray-900 truncate">
                          <span className="md:hidden lg:inline tablet-hidden">Sale #{sale.id.slice(-8)}</span>
                        </h3>
                        <p className="text-sm text-gray-500">
                          {sale.customers?.name || 'Walk-in Customer'}
                        </p>
                        <p className="hidden md:block text-xs text-gray-500">
                          {sale.sale_items.length} items
                        </p>
                        <p className="hidden lg:block text-sm text-gray-500">
                          {sale.customers?.name || 'Walk-in Customer'} • {sale.sale_items.length} items
                        </p>
                        <p className="hidden lg:block tablet-hidden text-sm text-gray-500">
                          Processed by {sale.users.email} • {formatRelativeTime(new Date(sale.created_at))}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 ml-6">
                      <div className="text-right">
                         <p className="text-sm font-medium text-gray-900">
                           {formatCurrency(Number(sale.total))}
                         </p>
                         <div className="text-xs text-gray-500 flex items-center space-x-2">
                           <span>{sale.payment_type}</span>
                           <span aria-hidden="true">•</span>
                           {renderSaleChannelBadge(sale.sale_channel)}
                           <span aria-hidden="true"></span>
                           {renderPaymentStatusSelect(sale)}
                         </div>
                      </div>
                      
                      {Number(sale.discount) > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            -{formatCurrency(Number(sale.discount))}
                          </p>
                          <p className="text-xs text-gray-500">discount</p>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/dashboard/sales/${sale.id}`}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          <UserIcon className="h-4 w-4 mr-2" />
                          <span className="md:hidden lg:inline">View Details</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
