'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useNotifications } from '@/contexts/NotificationContext'
import { deleteCategory, getCategory, updateCategory } from '@/actions/categories'
import { getErrorMessage } from '@/actions/http'
import {
  ArrowLeftIcon,
  CheckIcon,
  TrashIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import { type Category } from '@/types/category'

export default function EditCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const { addNotification } = useNotifications()
  const categoryId = params.id as string

  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchCategory = useCallback(async () => {
    try {
      const data = await getCategory(categoryId)
      setCategory(data)
    } catch (error) {
      console.error('Error fetching category:', error)
      setError(getErrorMessage(error, 'Failed to fetch category'))
    } finally {
      setLoading(false)
    }
  }, [categoryId])

  useEffect(() => {
    fetchCategory()
  }, [fetchCategory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category) return

    setSaving(true)
    setError('')

    try {
      await updateCategory(categoryId, category.name.trim())
      addNotification({
        type: 'success',
        title: 'Category Updated',
        message: 'Category has been updated successfully.',
        duration: 4000
      })
      // Redirect back to categories list
      router.push('/dashboard/categories')
    } catch (error) {
      console.error('Failed to update category:', error)
      const message = getErrorMessage(error, 'Failed to update category. Please try again.')
      setError(message)
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message,
        duration: 5000
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    addNotification({
      type: 'warning',
      title: 'Confirm Delete',
      message: `Are you sure you want to delete the category "${category?.name}"? This action cannot be undone.`,
      duration: 0,
      actions: [
        {
          label: 'Cancel',
          onClick: () => {},
          variant: 'secondary'
        },
        {
          label: 'Delete',
          onClick: () => performDelete(),
          variant: 'danger'
        }
      ]
    })
  }

  const performDelete = async () => {

    setSaving(true)
    setError('')

    try {
      await deleteCategory(categoryId)
      addNotification({
        type: 'success',
        title: 'Category Deleted',
        message: 'Category has been deleted successfully.',
        duration: 4000
      })
      // Redirect back to categories list
      router.push('/dashboard/categories')
    } catch (error) {
      console.error('Failed to delete category:', error)
      const message = getErrorMessage(error, 'Failed to delete category. Please try again.')
      setError(message)
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message,
        duration: 5000
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (value: string) => {
    if (!category) return
    setCategory({ ...category, name: value })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Category not found</h2>
        <p className="mt-2 text-gray-600">The category you&apos;re looking for doesn&apos;t exist.</p>
        <button
          onClick={() => router.push('/dashboard/categories')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Back to Categories
        </button>
      </div>
    )
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Category</h1>
            <p className="mt-2 text-sm text-gray-700">
              Update category information and details.
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={handleDelete}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </button>
          <button
            type="submit"
            form="edit-category-form"
            disabled={saving || !category.name.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Category Info */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TagIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
              <p className="text-sm text-gray-500">
                {category._count?.products || 0} products in this category
              </p>
            </div>
          </div>
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

      {/* Edit Form */}
      <form id="edit-category-form" onSubmit={handleSubmit} className="space-y-6">
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
                  value={category.name}
                  onChange={(e) => handleInputChange(e.target.value)}
                  required
                  className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
