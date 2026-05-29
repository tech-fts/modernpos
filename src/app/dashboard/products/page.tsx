'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useNotifications } from '@/contexts/NotificationContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner, Card, ErrorMessageCard } from '@/components/ui'
import { useSmartDataFetching, useDeleteConfirmation, useSearch } from '@/hooks'
import ProductImport from '@/components/ProductImport'
import { type ProductListItem, type ProductsApiResponse } from '@/types/product'
import { deleteProduct, listProducts } from '@/actions/products'
import { downloadCsvTemplate, productImportTemplateCsv } from '@/lib/import-templates'
import { getErrorMessage } from '@/actions/http'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TagIcon,
  CloudArrowUpIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addNotification } = useNotifications()
  const { formatCurrency } = useCurrency()
  const { settings } = useSettings()
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showImport, setShowImport] = useState(false)
  const filterInputClasses = 'block w-full pl-8 xs:pl-9 md:pl-10 lg:pl-12 pr-2.5 xs:pr-3 md:pr-3 lg:pr-4 py-2 xs:py-2.5 md:py-2.5 lg:py-3 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm md:text-sm lg:text-base'
  const formatAmount = (value: number | string) => formatCurrency(Number(value))

  // Use smart data fetching with caching
  const { 
    data: productsData, 
    loading, 
    error, 
    refetch: fetchProducts,
    clearCache
  } = useSmartDataFetching<ProductListItem[]>({
    cacheKey: 'products:list',
    fetcher: ({ signal }) => listProducts(signal),
    autoFetch: !!user,
    cacheDuration: 60000, // Short cache to keep inventory fresh
    debounceDelay: 250, // Quicker refetch on demand
    transform: (data: unknown) => {
      const response = data as ProductsApiResponse
      return response?.products || []
    }
  })


  
  // Extract products array from the response
  const products = Array.isArray(productsData) ? productsData : []
  
  // Use the new search hook
  const { 
    searchTerm, 
    filteredData: searchFilteredProducts, 
    handleSearchChange 
  } = useSearch<ProductListItem>({
    data: products,
    searchFields: ['name', 'sku']
  })

  // Use the new delete confirmation hook
  const { confirmDelete } = useDeleteConfirmation()

  const handleDownloadTemplate = () => {
    downloadCsvTemplate('product-import-template.csv', productImportTemplateCsv)
  }

  const handleDeleteProduct = async (productId: string) => {
    confirmDelete(
      productId,
      'this product',
      async (id: string) => {
        try {
          await deleteProduct(id)
          // Refresh the products list
          fetchProducts()
          addNotification({
            type: 'success',
            title: 'Product Deleted',
            message: 'Product has been deleted successfully.',
            duration: 4000
          })
        } catch (error) {
          throw new Error(getErrorMessage(error, 'Failed to delete product'))
        }
      },
      {
        message: 'Are you sure you want to delete this product? This action cannot be undone.',
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

  // Apply category filter on top of search filter
  const filteredProducts = Array.isArray(searchFilteredProducts) 
    ? searchFilteredProducts.filter(product => {
        return selectedCategory === 'all' || product.categories?.name === selectedCategory
      })
    : []
  
  const categories = ['all', ...Array.from(new Set(products.map(p => p.categories?.name || 'Uncategorized')))]

  // Force-refresh when redirected from product creation
  useEffect(() => {
    if (searchParams.get('refresh') === '1') {
      ;(async () => {
        clearCache()
        await fetchProducts()
        router.replace('/dashboard/products')
      })()
    }
  }, [searchParams, clearCache, fetchProducts, router])

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg xs:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 xs:mt-2 md:mt-3 text-xs xs:text-sm md:text-base text-gray-700">
            Manage your product inventory and stock levels.
          </p>
        </div>
        <div className="mt-3 xs:mt-4 md:mt-6 sm:mt-0 flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-2 md:space-x-4 sm:space-x-3">
          <button
            onClick={() => setShowImport(!showImport)}
            className="inline-flex items-center justify-center px-2.5 xs:px-3 md:px-4 lg:px-6 py-1.5 xs:py-2 md:py-2.5 lg:py-3 border border-gray-300 rounded-md shadow-sm text-xs xs:text-sm md:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <CloudArrowUpIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 mr-1 xs:mr-1.5 md:mr-2 lg:mr-3" />
            Bulk Import
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center justify-center px-2.5 xs:px-3 md:px-4 lg:px-6 py-1.5 xs:py-2 md:py-2.5 lg:py-3 border border-gray-300 rounded-md shadow-sm text-xs xs:text-sm md:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <DocumentArrowDownIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 mr-1 xs:mr-1.5 md:mr-2 lg:mr-3" />
            Download Template
          </button>
          <Link
            href="/dashboard/categories"
            className="inline-flex items-center justify-center px-2.5 xs:px-3 md:px-4 lg:px-6 py-1.5 xs:py-2 md:py-2.5 lg:py-3 border border-gray-300 rounded-md shadow-sm text-xs xs:text-sm md:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <TagIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 mr-1 xs:mr-1.5 md:mr-2 lg:mr-3" />
            Manage Categories
          </Link>
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center justify-center px-2.5 xs:px-3 md:px-4 lg:px-6 py-1.5 xs:py-2 md:py-2.5 lg:py-3 border border-transparent rounded-md shadow-sm text-xs xs:text-sm md:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 mr-1 xs:mr-1.5 md:mr-2 lg:mr-3" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Bulk Import Section */}
      {showImport && (
        <Card>
          <ProductImport />
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <div className="grid grid-cols-1 gap-2.5 xs:gap-3 md:gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 xs:pl-3 md:pl-3 lg:pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={filterInputClasses}
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 xs:pl-3 md:pl-3 lg:pl-4 flex items-center pointer-events-none">
              <FunnelIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-gray-400" />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={filterInputClasses}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 xs:pl-3 md:pl-3 lg:pl-4 flex items-center pointer-events-none">
              <TagIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-gray-400" />
            </div>
            <select
              className="block w-full pl-8 xs:pl-9 md:pl-10 lg:pl-12 pr-2.5 xs:pr-3 md:pr-3 lg:pr-4 py-1.5 xs:py-2 md:py-2.5 lg:py-3 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm md:text-sm lg:text-base"
            >
              <option value="all">All Stock Levels</option>
              <option value="low">Low Stock ({settings.lowStockThreshold} or less)</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && <ErrorMessageCard message={error} />}

      {/* Products List */}
      <Card className="overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="px-4 py-12 sm:px-8 sm:py-16 text-center">
            <TagIcon className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
            <h3 className="mt-3 text-lg font-medium text-gray-900 sm:text-xl">
              {searchTerm || selectedCategory !== 'all' ? 'No products found' : 'No products yet'}
            </h3>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search terms or filters.'
                : 'Get started by creating your first product.'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <div className="mt-6">
                <Link
                  href="/dashboard/products/new"
                  className="inline-flex items-center px-4 py-2.5 sm:px-6 sm:py-3 border border-transparent shadow-sm text-sm sm:text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Add Product
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredProducts.map((product) => (
              <div key={product.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                {/* Mobile Layout: Stacked */}
                <div className="block sm:hidden space-y-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <TagIcon className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        SKU: {product.sku} • {product.categories.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Price: {formatAmount(product.price)}   Cost: {formatAmount(product.cost)} • Stock: {product.stock}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/dashboard/products/${product.id}/edit`}
                      className="inline-flex items-center justify-center px-3 py-2.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <PencilIcon className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
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
                        <TagIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <h4 className="text-base font-medium text-gray-900 truncate">
                        {product.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        SKU: {product.sku} • {product.categories.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 ml-6">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatAmount(product.price)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Cost: {formatAmount(product.cost)}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {product.stock}
                      </p>
                      <p className="text-xs text-gray-500">in stock</p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Link
                        href={`/dashboard/products/${product.id}/edit`}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
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
