'use client'

import { useState } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { useAuth } from '@/contexts/AuthContext'
import CategoryImport from '@/components/CategoryImport'
import { deleteCategory, listCategories } from '@/actions/categories'
import { 
  LoadingSpinner, 
  MobileOptimizedCard, 
  ResponsiveButton, 
  ResponsiveLinkButton,
  ResponsiveInput,
  ResponsiveContainer,
  ResponsiveGrid 
} from '@/components/ui'
import { useSmartDataFetching, useDeleteConfirmation, useSearch } from '@/hooks'
import { useMobileLayout } from '@/hooks/useMobileLayout'
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import { type Category } from '@/types/category'

export default function CategoriesPage() {
  const { addNotification } = useNotifications()
  const { user } = useAuth()
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  
  // Mobile layout utilities
  const { isMobile, getResponsiveValue } = useMobileLayout()

  // Use smart data fetching with caching
  const { 
    data: categoriesData, 
    loading, 
    error, 
    refetch: fetchCategories 
  } = useSmartDataFetching<Category[]>({
    cacheKey: 'categories:list',
    fetcher: ({ signal }) => listCategories(signal),
    autoFetch: !!user,
    cacheDuration: 300000, // Cache for 5 minutes
    debounceDelay: 500 // Debounce API calls
  })

  const categories = categoriesData || []

  // Use the new search hook
  const { 
    searchTerm, 
    filteredData: filteredCategories, 
    handleSearchChange 
  } = useSearch<Category>({
    data: categories,
    searchFields: ['name']
  })

  // Use the new delete confirmation hook
  const { confirmDelete } = useDeleteConfirmation()

  const handleDelete = async (categoryId: string, categoryName: string) => {
    confirmDelete(
      categoryId,
      categoryName,
      async (id: string) => {
        setDeleteLoading(id)
        
        try {
          await deleteCategory(id)
          // Update the data in the hook
          fetchCategories()
          
          addNotification({
            type: 'success',
            title: 'Category Deleted',
            message: 'Category has been deleted successfully.',
            duration: 4000
          })
        } finally {
          setDeleteLoading(null)
        }
      },
      {
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
    <ResponsiveContainer padding="sm">
      <div className="space-y-4">
        {/* Header - Mobile-optimized */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className={`${getResponsiveValue('text-lg', 'text-xl', 'text-2xl')} font-bold text-gray-900`}>
              Categories
            </h1>
            <p className={`mt-1 ${getResponsiveValue('text-sm', 'text-base', 'text-lg')} text-gray-600`}>
              Manage product categories
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <ResponsiveLinkButton
              variant="primary"
              size={isMobile ? 'sm' : 'md'}
              icon={PlusIcon}
              fullWidth={isMobile}
              href="/dashboard/categories/new"
            >
              New Category
            </ResponsiveLinkButton>
          </div>
        </div>

        {/* Stats Cards - Mobile-optimized */}
        <ResponsiveGrid
          cols={{ xs: 1, sm: 3, md: 3, lg: 3, xl: 3 }}
          gap={{ xs: 3, sm: 4, md: 4, lg: 6, xl: 6 }}
        >
          {/* Mobile: Single card, Tablet/Desktop: Three cards */}
          <MobileOptimizedCard variant="default" padding="sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`${isMobile ? 'min-h-[44px] min-w-[44px]' : 'h-12 w-12'} bg-blue-100 rounded-full flex items-center justify-center`}>
                  <TagIcon className={`${getResponsiveValue('h-5 w-5', 'h-6 w-6', 'h-6 w-6')} text-blue-600`} />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className={`${getResponsiveValue('text-sm', 'text-base', 'text-base')} font-medium text-gray-500`}>
                  Total Categories
                </p>
                <p className={`${getResponsiveValue('text-2xl', 'text-3xl', 'text-3xl')} font-bold text-gray-900`}>
                  {categories.length}
                </p>
              </div>
            </div>
          </MobileOptimizedCard>

          {/* Tablet/Desktop only stats */}
          <MobileOptimizedCard 
            variant="default" 
            padding="sm" 
            className="hidden sm:block"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TagIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-base font-medium text-gray-500">Active Categories</p>
                <p className="text-3xl font-bold text-gray-900">
                  {categories.filter(cat => (cat._count?.products || 0) > 0).length}
                </p>
              </div>
            </div>
          </MobileOptimizedCard>

          <MobileOptimizedCard 
            variant="default" 
            padding="sm" 
            className="hidden sm:block"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TagIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-base font-medium text-gray-500">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">
                  {categories.reduce((sum, cat) => sum + (cat._count?.products || 0), 0)}
                </p>
              </div>
            </div>
          </MobileOptimizedCard>
        </ResponsiveGrid>

        {/* Search and Import - Mobile-optimized */}
        <ResponsiveGrid
          cols={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
          gap={{ xs: 3, sm: 4, md: 4, lg: 6, xl: 6 }}
        >
          {/* Search */}
          <MobileOptimizedCard variant="default" padding="sm">
            <ResponsiveInput
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search categories..."
              icon={TagIcon}
              size={isMobile ? 'sm' : 'md'}
              mobileSize={isMobile ? 'compact' : 'standard'}
            />
          </MobileOptimizedCard>

          {/* Category Import */}
          <MobileOptimizedCard variant="default" padding="sm">
            <CategoryImport />
          </MobileOptimizedCard>
        </ResponsiveGrid>

        {/* Error Message */}
        {error && (
          <MobileOptimizedCard variant="outlined" className="bg-red-50 border-red-200">
            <div className="flex">
              <div className="ml-3">
                <h3 className={`${getResponsiveValue('text-sm', 'text-base', 'text-base')} font-medium text-red-800`}>
                  Error
                </h3>
                <div className={`mt-2 ${getResponsiveValue('text-sm', 'text-base', 'text-base')} text-red-700`}>
                  {error}
                </div>
              </div>
            </div>
          </MobileOptimizedCard>
        )}

        {/* Categories List - Mobile-optimized */}
        <MobileOptimizedCard variant="default" className="overflow-hidden">
          {filteredCategories.length === 0 ? (
            <div className={`px-4 py-12 sm:px-8 sm:py-16 text-center`}>
              <TagIcon className={`mx-auto ${getResponsiveValue('h-12 w-12', 'h-16 w-16', 'h-16 w-16')} text-gray-400`} />
              <h3 className={`mt-3 ${getResponsiveValue('text-lg', 'text-xl', 'text-xl')} font-medium text-gray-900`}>
                {searchTerm ? 'No categories found' : 'No categories yet'}
              </h3>
              <p className={`mt-2 ${getResponsiveValue('text-sm', 'text-base', 'text-base')} text-gray-500`}>
                {searchTerm 
                  ? 'Try adjusting your search terms.'
                  : 'Get started by creating your first category.'
                }
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <ResponsiveLinkButton
                    variant="primary"
                    size={isMobile ? 'sm' : 'md'}
                    icon={PlusIcon}
                    href="/dashboard/categories/new"
                  >
                    New Category
                  </ResponsiveLinkButton>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredCategories.map((category) => (
                <div key={category.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  {/* Mobile Layout: Stacked (Category name first, then buttons in two columns) */}
                  <div className="block sm:hidden space-y-3">
                    {/* Category Name Section - Full Width */}
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`${isMobile ? 'min-h-[44px] min-w-[44px]' : 'h-10 w-10'} bg-blue-100 rounded-full flex items-center justify-center`}>
                          <TagIcon className={`${getResponsiveValue('h-4 w-4', 'h-5 w-5', 'h-5 w-5')} text-blue-600`} />
                        </div>
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <h4 className={`${getResponsiveValue('text-sm', 'text-base', 'text-base')} font-medium text-gray-900 truncate`}>
                          {category.name}
                        </h4>
                        <p className={`${getResponsiveValue('text-xs', 'text-sm', 'text-sm')} text-gray-500`}>
                          {category._count?.products || 0} products
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons - Two Columns in One Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <ResponsiveLinkButton
                        variant="secondary"
                        size="sm"
                        icon={PencilIcon}
                        href={`/dashboard/categories/${category.id}/edit`}
                        fullWidth
                      >
                        Edit
                      </ResponsiveLinkButton>
                      <ResponsiveButton
                        variant="danger"
                        size="sm"
                        icon={TrashIcon}
                        onClick={() => handleDelete(category.id, category.name)}
                        disabled={deleteLoading === category.id}
                        loading={deleteLoading === category.id}
                        fullWidth
                      >
                        {deleteLoading === category.id ? 'Deleting...' : 'Delete'}
                      </ResponsiveButton>
                    </div>
                  </div>

                  {/* Tablet/Desktop Layout: Horizontal */}
                  <div className="hidden sm:flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <TagIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <h4 className="text-base font-medium text-gray-900 truncate">
                          {category.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {category._count?.products || 0} products
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons - Horizontal layout */}
                    <div className="flex items-center space-x-3 ml-6">
                      <ResponsiveLinkButton
                        variant="secondary"
                        size="md"
                        icon={PencilIcon}
                        href={`/dashboard/categories/${category.id}/edit`}
                      >
                        Edit
                      </ResponsiveLinkButton>
                      <ResponsiveButton
                        variant="danger"
                        size="md"
                        icon={TrashIcon}
                        onClick={() => handleDelete(category.id, category.name)}
                        disabled={deleteLoading === category.id}
                        loading={deleteLoading === category.id}
                      >
                        {deleteLoading === category.id ? 'Deleting...' : 'Delete'}
                      </ResponsiveButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </MobileOptimizedCard>
      </div>
    </ResponsiveContainer>
  )
}
