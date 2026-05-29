'use client'

import { useMemo } from 'react'
import { useSettings } from '@/contexts/SettingsContext'
import { useSmartDataFetching } from '@/hooks'
import { type ProductListItem, type ProductsApiResponse } from '@/types/product'
import { listProducts } from '@/actions/products'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function LowStockAlert() {
  const { settings } = useSettings()

  // Use smart data fetching with caching
  const { 
    data: productsData, 
    loading 
  } = useSmartDataFetching<ProductsApiResponse>({
    cacheKey: 'products:list',
    fetcher: ({ signal }) => listProducts(signal),
    autoFetch: true,
    cacheDuration: 300000, // Cache for 5 minutes
    debounceDelay: 1000, // Debounce API calls
    skipCache: false
  })

  // Filter low stock products using useMemo to prevent recalculation
  const lowStockProducts = useMemo(() => {
    if (!productsData?.products) return []
    
    return productsData.products.filter((product: ProductListItem) => 
      product.stock <= settings.lowStockThreshold
    )
  }, [productsData?.products, settings.lowStockThreshold])

  // Don't render if loading, no low stock products, or notifications disabled
  if (loading || lowStockProducts.length === 0 || !settings.notifications.lowStock) {
    return null
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start">
        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Low Stock Alert ({lowStockProducts.length} items)
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p className="mb-2">
              The following products are running low on stock (≤ {settings.lowStockThreshold} units):
            </p>
            <ul className="space-y-1">
              {lowStockProducts.slice(0, 3).map((product) => (
                <li key={product.id} className="flex justify-between items-center">
                  <span className="truncate">{product.name}</span>
                  <span className="text-yellow-600 font-medium">
                    {product.stock} units left
                  </span>
                </li>
              ))}
            </ul>
            {lowStockProducts.length > 3 && (
              <p className="text-xs text-yellow-600 mt-2">
                +{lowStockProducts.length - 3} more items with low stock
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
