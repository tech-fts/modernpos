import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
// Note: formatDistanceToNow was removed to avoid adding an extra dependency
import { type ApiProduct, type ProductDetail } from '@/types/product'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to show relative time (e.g., "2 days ago", "1 week ago")
 * This makes data appear less "new" and more realistic
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInMs = now.getTime() - targetDate.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  const diffInWeeks = Math.floor(diffInDays / 7)
  const diffInMonths = Math.floor(diffInDays / 30)
  const diffInYears = Math.floor(diffInDays / 365)

  if (diffInYears > 0) {
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`
  } else if (diffInMonths > 0) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`
  } else if (diffInWeeks > 0) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`
  } else if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  } else {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
      } else {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
        if (diffInMinutes > 0) {
          return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
        } else {
          return 'Just now'
        }
      }
    }
  }

/**
 * Format a date to show both relative time and actual date
 * Useful for showing both "2 days ago" and "Aug 26, 2025"
 */
export function formatDateWithRelative(date: string | Date): string {
  const relative = formatRelativeTime(date)
  const actual = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  
  // If it's more than 1 year ago, show both relative and actual
  // If it's recent (within a few days), just show relative
  const targetDate = new Date(date)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays > 7) {
    return `${relative} (${actual})`
  } else {
    return relative
  }
}

/**
 * Transform API product data to frontend format with null safety
 * This ensures consistent data structure across the application
 */
export function transformProductData(apiProduct: ApiProduct): ProductDetail {
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    description: apiProduct.description || '',
    price: apiProduct.price,
    cost: apiProduct.cost,
    stock: apiProduct.stock,
    category: apiProduct.categories?.id || '', // Handle both categories (API) and category (frontend)
    sku: apiProduct.sku,
    barcode: apiProduct.barcode || ''
  }
}

/**
 * Transform frontend product data to API format
 */
export function transformToApiFormat(frontendProduct: ProductDetail): {
  name: string
  description: string
  sku: string
  barcode: string
  price: number
  cost: number
  stock: number
  category_id: string
} {
  return {
    name: frontendProduct.name,
    description: frontendProduct.description,
    sku: frontendProduct.sku,
    barcode: frontendProduct.barcode,
    price: Number(frontendProduct.price),
    cost: Number(frontendProduct.cost),
    stock: Number(frontendProduct.stock),
    category_id: frontendProduct.category
  }
}

/**
 * Convert amount from current currency to MMK (base currency)
 * This utility ensures consistent currency conversion across the application
 */
export function convertToMMK(amount: number, currentCurrencyCode: string, exchangeRate: number): number {
  if (currentCurrencyCode === 'MMK') {
    return amount
  }
  
  // Convert from current currency to MMK
  return amount / exchangeRate
}

/**
 * Safely convert string or number to number with fallback
 */
export function safeNumber(value: string | number | null | undefined, fallback: number = 0): number {
  if (value === null || value === undefined) {
    return fallback
  }
  
  const num = Number(value)
  return isNaN(num) ? fallback : num
}
