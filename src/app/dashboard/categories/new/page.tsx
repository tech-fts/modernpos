'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useNotifications } from '@/contexts/NotificationContext'
import { createCategory } from '@/actions/categories'
import { getErrorMessage } from '@/actions/http'
import {
  ArrowLeftIcon,
  CheckIcon,
  TagIcon
} from '@heroicons/react/24/outline'

export default function NewCategoryPage() {
  const router = useRouter()
  const { addNotification } = useNotifications()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    setError('')

    try {
      await createCategory(name.trim())
      addNotification({
        type: 'success',
        title: 'Category Created',
        message: 'New category has been created successfully.',
        duration: 4000
      })
      // Redirect back to categories list
      router.push('/dashboard/categories')
    } catch (error) {
      console.error('Failed to create category:', error)
      const message = getErrorMessage(error, 'Failed to create category. Please try again.')
      setError(message)
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message,
        duration: 5000
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center">
          <Link
            href="/dashboard/categories"
            className="mr-4 p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Category</h1>
            <p className="mt-2 text-sm text-gray-700">
              Create a new product category to organize your inventory.
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="submit"
            form="new-category-form"
            disabled={saving || !name.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            {saving ? 'Creating...' : 'Create Category'}
          </button>
        </div>
      </div>

      {/* Error Message */}
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

      {/* Form */}
      <form id="new-category-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Category Information
            </h3>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Category Name *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <TagIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm pl-12 pr-4 py-3"
                  placeholder="e.g., Electronics, Clothing, Food"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Choose a descriptive name that will help organize your products.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
