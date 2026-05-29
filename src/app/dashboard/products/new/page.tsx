'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useNotifications } from '@/contexts/NotificationContext'
import CurrencySelector from '@/components/CurrencySelector'
import { useCsrfToken } from '@/hooks/useCsrfToken'
import { type Category } from '@/types/category'
import { listCategories } from '@/actions/categories'
import { createProduct } from '@/actions/products'
import { getErrorMessage } from '@/actions/http'
import { convertToMMK } from '@/lib/utils'
import { generateBarcodeEan13, generateSku } from '@/lib/product-identifiers'

export default function NewProductPage() {
  const router = useRouter()
  const { currentCurrency } = useCurrency()
  const { addNotification } = useNotifications()
  const csrfToken = useCsrfToken()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    category: '',
  })

  const [categories, setCategories] = useState<Category[]>([])
  const inputBaseClasses = 'block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm sm:text-base'
  const inputPaddingClasses = 'px-3 xs:px-3.5 sm:px-4 py-2 xs:py-2.5 sm:py-3'
  const inputClasses = `${inputBaseClasses} ${inputPaddingClasses}`
  const actionButtonBase = 'inline-flex items-center justify-center rounded-md shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors text-xs xs:text-sm sm:text-base'

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await listCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      // Convert price and cost to MMK before sending to API
      const mmkPrice = convertToMMK(parseFloat(formData.price), currentCurrency.code, currentCurrency.exchangeRate)
      const mmkCost = convertToMMK(parseFloat(formData.cost), currentCurrency.code, currentCurrency.exchangeRate)

      const productData = {
        name: formData.name,
        description: formData.description,
        sku: generateSku(formData.name),
        barcode: generateBarcodeEan13(),
        price: mmkPrice,
        cost: mmkCost,
        stock: parseInt(formData.stock),
        category_id: formData.category,
        csrfToken: csrfToken
      }

      await createProduct(productData)
      addNotification({
        type: 'success',
        title: 'Product Created',
        message: `Product "${formData.name}" has been created successfully.`,
        duration: 5000
      })
      // Redirect back to products list
      router.push('/dashboard/products?refresh=1')
    } catch (error) {
      console.error('Failed to create product:', error)
      setError(getErrorMessage(error, 'Failed to create product. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  // Helper function to get currency symbol
  const getCurrencySymbol = () => {
    return currentCurrency?.symbol || currentCurrency?.code || 'MMK'
  }

  // Helper function to format input value for display
  const formatInputValue = (value: string) => {
    if (!value) return ''
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return ''
    return numValue.toString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center">
          <button
            onClick={() => router.push('/dashboard/products')}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
            <p className="mt-2 text-sm text-gray-700">
              Create a new product and add it to your inventory.
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="submit"
            form="new-product-form"
            disabled={saving}
            className={`${actionButtonBase} px-3 xs:px-4 sm:px-5 py-2 xs:py-2.5 sm:py-3 border border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-50`}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {saving ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Currency Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-800">Current Currency</h3>
            <p className="text-sm text-blue-600">
              {currentCurrency?.name} ({currentCurrency?.code}) - {currentCurrency?.symbol}
            </p>
          </div>
          <CurrencySelector />
        </div>
      </div>

      {/* New Product Form */}
      <form id="new-product-form" onSubmit={handleSubmit} className="space-y-6">
        {/* CSRF Protection */}
        <input type="hidden" name="csrfToken" value={csrfToken} />
        
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Product Information
            </h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className={`mt-1 ${inputClasses}`}
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                        <select
                          id="category"
                          value={formData.category}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          required
                          className={`mt-1 ${inputClasses}`}
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
              </div>

              <div className="sm:col-span-2">
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                  <p className="text-sm text-gray-700">
                    SKU and barcode are generated automatically when you create the product.
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Selling Price *
                </label>
                                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">{getCurrencySymbol()}</span>
                    </div>
                    <input
                      type="number"
                      id="price"
                      step="0.01"
                      min="0"
                      value={formatInputValue(formData.price)}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      required
                      className={`pl-12 pr-3 xs:pr-3.5 sm:pr-4 ${inputBaseClasses} py-2 xs:py-2.5 sm:py-3`}
                    />
                  </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter price in {currentCurrency?.code} ({currentCurrency?.name})
                  {currentCurrency?.code !== 'MMK' && ` - Will be converted to MMK for storage`}
                </p>
              </div>

              <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
                  Cost Price *
                </label>
                                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">{getCurrencySymbol()}</span>
                    </div>
                    <input
                      type="number"
                      id="cost"
                      step="0.01"
                      min="0"
                      value={formatInputValue(formData.cost)}
                      onChange={(e) => handleInputChange('cost', e.target.value)}
                      required
                      className={`pl-12 pr-3 xs:pr-3.5 sm:pr-4 ${inputBaseClasses} py-2 xs:py-2.5 sm:py-3`}
                    />
                  </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter cost in {currentCurrency?.code} ({currentCurrency?.name})
                  {currentCurrency?.code !== 'MMK' && ` - Will be converted to MMK for storage`}
                </p>
              </div>

              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  id="stock"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  required
                  className={`mt-1 ${inputClasses}`}
                />
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`mt-1 ${inputClasses}`}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
