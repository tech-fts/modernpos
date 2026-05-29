'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface UseDataFetchingOptions<T> {
  endpoint: string
  autoFetch?: boolean
  transform?: (data: unknown) => T
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
  dependencies?: unknown[]
}

interface UseDataFetchingReturn<T> {
  data: T | null
  loading: boolean
  error: string
  fetchData: () => Promise<void>
  refetch: () => Promise<void>
  setData: (data: T) => void
  clearError: () => void
}

export const useDataFetching = <T = unknown>({
  endpoint,
  autoFetch = true,
  transform,
  onSuccess,
  onError,
  dependencies = []
}: UseDataFetchingOptions<T>): UseDataFetchingReturn<T> => {
  const { user } = useAuth()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(endpoint)
      
      if (response.ok) {
        const result = await response.json()
        const transformedData = transform ? transform(result) : result
        setData(transformedData)
        onSuccess?.(transformedData)
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [endpoint, user, transform, onSuccess, onError])

  const refetch = useCallback(() => fetchData(), [fetchData])
  
  const clearError = useCallback(() => setError(''), [])

  useEffect(() => {
    if (autoFetch && user) {
      fetchData()
    }
  }, [autoFetch, user, fetchData])

  // Handle dependencies separately without spreading
  useEffect(() => {
    if (autoFetch && user && dependencies.length > 0) {
      fetchData()
    }
  }, [autoFetch, user, fetchData, dependencies])

  return {
    data,
    loading,
    error,
    fetchData,
    refetch,
    setData,
    clearError
  }
}

export default useDataFetching
