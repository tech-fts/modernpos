'use client'


import Link from 'next/link'
import { useNotifications } from '@/contexts/NotificationContext'
import { formatRelativeTime } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner, Card, ErrorMessageCard } from '@/components/ui'
import { useSmartDataFetching, useDeleteConfirmation, useSearch } from '@/hooks'
import { type Customer, type CustomersApiResponse } from '@/types/customer'
import { deleteCustomer, listCustomers } from '@/actions/customers'
import { getErrorMessage } from '@/actions/http'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'

export default function CustomersPage() {
  const { addNotification } = useNotifications()
  const { user } = useAuth()

  // Use smart data fetching with caching
  const { 
    data: customersData, 
    loading, 
    error, 
    refetch: fetchCustomers 
  } = useSmartDataFetching<Customer[]>({
    cacheKey: 'customers:list',
    fetcher: ({ signal }) => listCustomers(signal),
    autoFetch: !!user,
    cacheDuration: 300000, // Cache for 5 minutes
    debounceDelay: 500, // Debounce API calls
    transform: (data: unknown) => (data as CustomersApiResponse).customers || []
  })

  const customers = customersData || []

  // Use the new search hook
  const { 
    searchTerm, 
    filteredData: filteredCustomers, 
    handleSearchChange 
  } = useSearch<Customer>({
    data: customers,
    searchFields: ['name', 'phone', 'email']
  })

  // Use the new delete confirmation hook
  const { confirmDelete } = useDeleteConfirmation()

  const handleDeleteCustomer = async (customerId: string) => {
    confirmDelete(
      customerId,
      'this customer',
      async (id: string) => {
        try {
          await deleteCustomer(id)
          // Refresh the customers list
          fetchCustomers()
          addNotification({
            type: 'success',
            title: 'Customer Deleted',
            message: 'Customer has been deleted successfully.',
            duration: 4000
          })
        } catch (error) {
          throw new Error(getErrorMessage(error, 'Failed to delete customer'))
        }
      },
      {
        message: 'Are you sure you want to delete this customer? This action cannot be undone.',
        onError: (errorMessage) => {
          addNotification({
            type: 'error',
            title: 'Delete Failed',
            message: errorMessage,
            duration: 5000
          })
        }
      }
    )
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-4 px-3 sm:px-0">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">Customers</h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base lg:text-lg">
            Manage your customer database and relationships.
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <Link
            href="/dashboard/customers/new"
            className="flex w-full sm:w-auto justify-center items-center px-4 py-2.5 sm:px-6 sm:py-3 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            New Customer
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-500 sm:text-base">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 sm:text-3xl">{customers.length}</p>
            </div>
          </div>
        </Card>

        <Card className="hidden sm:block">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <PhoneIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-base font-medium text-gray-500">Active Customers</p>
              <p className="text-3xl font-bold text-gray-900">{customers.filter(cust => (cust._count?.sales || 0) > 0).length}</p>
            </div>
          </div>
        </Card>

        <Card className="hidden sm:block">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <EnvelopeIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-base font-medium text-gray-500">Total Sales</p>
              <p className="text-3xl font-bold text-gray-900">{customers.reduce((sum, cust) => sum + (cust._count?.sales || 0), 0)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="block w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border border-gray-300 rounded-lg text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search customers by name, phone, or email..."
          />
        </div>
      </Card>

      {/* Error Message */}
      {error && <ErrorMessageCard message={error} />}

      {/* Customers List */}
      <Card className="overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="px-4 py-12 sm:px-8 sm:py-16 text-center">
            <UserIcon className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
            <h3 className="mt-3 text-lg font-medium text-gray-900 sm:text-xl">
              {searchTerm ? 'No customers found' : 'No customers yet'}
            </h3>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              {searchTerm 
                ? 'Try adjusting your search terms.'
                : 'Get started by creating your first customer.'
              }
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Link
                  href="/dashboard/customers/new"
                  className="inline-flex items-center px-4 py-2.5 sm:px-6 sm:py-3 border border-transparent shadow-sm text-sm sm:text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  New Customer
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                {/* Mobile Layout: Stacked */}
                <div className="block sm:hidden space-y-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {customer.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {customer.phone} • {customer.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {customer.address}, {customer.city}, {customer.state} {customer.zip_code}
                      </p>
                      <p className="text-xs text-gray-500">
                        {customer._count?.sales || 0} sales • Joined {formatRelativeTime(new Date(customer.createdAt))}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      className="inline-flex items-center justify-center px-3 py-2.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <PencilIcon className="h-3.5 w-3.5 mr-1.5" />
                      View
                    </Link>
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="inline-flex items-center justify-center px-3 py-2.5 border border-red-300 rounded-lg text-xs font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                      <TrashIcon className="h-3.5 w-3.5 mr-1.5" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Tablet/Desktop Layout: Horizontal */}
                <div className="hidden sm:flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <h4 className="text-base font-medium text-gray-900 truncate">
                        {customer.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {customer.phone} • {customer.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        {customer.address}, {customer.city}, {customer.state} {customer.zip_code}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 ml-6">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {customer._count?.sales || 0}
                      </p>
                      <p className="text-xs text-gray-500">sales</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {formatRelativeTime(new Date(customer.createdAt))}
                      </p>
                      <p className="text-xs text-gray-500">joined</p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        View
                      </Link>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

