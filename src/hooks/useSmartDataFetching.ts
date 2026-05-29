'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

type SmartFetcher = (context: { signal: AbortSignal }) => Promise<unknown>

const EMPTY_DEPS: unknown[] = []

interface UseSmartDataFetchingOptions<T> {
  endpoint?: string
  fetcher?: SmartFetcher
  cacheKey?: string
  autoFetch?: boolean
  cacheDuration?: number // in milliseconds
  debounceDelay?: number // in milliseconds
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
  transform?: (data: unknown) => T
  dependencies?: unknown[]
  skipCache?: boolean
}

interface UseSmartDataFetchingReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  clearCache: () => void
  lastFetched: number | null
}

// Global cache to prevent duplicate requests across components
const globalCache = new Map<string, CacheEntry<unknown>>()

function useSmartDataFetching<T = unknown>({
  endpoint,
  fetcher,
  cacheKey: cacheKeyOverride,
  autoFetch = true,
  cacheDuration = 30000, // 30 seconds default
  debounceDelay = 300, // 300ms default
  onSuccess,
  onError,
  transform,
  dependencies = EMPTY_DEPS,
  skipCache = false
}: UseSmartDataFetchingOptions<T>): UseSmartDataFetchingReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<number | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasFetchedRef = useRef(false)
  const loadingRef = useRef(false)
  const fetcherRef = useRef<SmartFetcher | undefined>(fetcher)
  const transformRef = useRef<UseSmartDataFetchingOptions<T>['transform']>(transform)
  const onSuccessRef = useRef<UseSmartDataFetchingOptions<T>['onSuccess']>(onSuccess)
  const onErrorRef = useRef<UseSmartDataFetchingOptions<T>['onError']>(onError)
  const cacheKey = useMemo(() => {
    const resolved = cacheKeyOverride ?? endpoint
    if (!resolved) {
      throw new Error('useSmartDataFetching requires either "endpoint" or "cacheKey" (when using "fetcher").')
    }
    return resolved
  }, [cacheKeyOverride, endpoint])

  useEffect(() => {
    loadingRef.current = loading
  }, [loading])

  useEffect(() => {
    fetcherRef.current = fetcher
  }, [fetcher])

  useEffect(() => {
    transformRef.current = transform
  }, [transform])

  useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  // Check if data is still fresh in cache
  const isCacheValid = useCallback((entry: CacheEntry<unknown>): boolean => {
    return Date.now() < entry.expiresAt
  }, [])

  // Get cached data if available and valid
  const getCachedData = useCallback((): T | null => {
    if (skipCache) return null
    
    const cached = globalCache.get(cacheKey)
    if (cached && isCacheValid(cached)) {
      // Apply transform to cached data as well to ensure consistency
      const currentTransform = transformRef.current
      if (currentTransform) {
        return currentTransform(cached.data) as T
      }
      return cached.data as T
    }
    return null
  }, [cacheKey, skipCache, isCacheValid])

  // Set cached data
  const setCachedData = useCallback((newData: unknown) => {
    if (skipCache) return
    
    const entry: CacheEntry<unknown> = {
      data: newData,
      timestamp: Date.now(),
      expiresAt: Date.now() + cacheDuration
    }
    globalCache.set(cacheKey, entry)
  }, [cacheKey, cacheDuration, skipCache])

  // Clear cache for this endpoint
  const clearCache = useCallback(() => {
    globalCache.delete(cacheKey)
  }, [cacheKey])

  // Fetch data with proper error handling and caching
  const fetchData = useCallback(async (): Promise<void> => {
    // Check cache first
    const cachedData = getCachedData()
    if (cachedData) {
      setData(cachedData)
      setError(null)
      return
    }

    // Prevent duplicate requests
    if (loadingRef.current) return

    if (!endpoint && !fetcherRef.current) {
      throw new Error('useSmartDataFetching requires either "endpoint" or "fetcher".')
    }

    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    const controller = new AbortController()
    abortControllerRef.current = controller
    const { signal } = controller
    const resolvedEndpoint = endpoint
    
    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const rawData = fetcherRef.current
        ? await fetcherRef.current({ signal })
        : await (async () => {
            if (!resolvedEndpoint) {
              throw new Error('useSmartDataFetching requires either "endpoint" or "fetcher".')
            }

            const response = await fetch(resolvedEndpoint, {
              signal,
              credentials: 'include'
            })

            if (!response.ok) {
              let errorMessage = `HTTP error! status: ${response.status}`
              try {
                const errorBody = await response.clone().json()
                if (errorBody?.error) {
                  errorMessage = `${response.status} ${errorBody.error}`
                } else if (errorBody?.message) {
                  errorMessage = `${response.status} ${errorBody.message}`
                }
              } catch {
                try {
                  const errorText = await response.clone().text()
                  if (errorText) {
                    errorMessage = `${response.status} ${errorText}`
                  }
                } catch {
                  // ignore parse errors, keep default message
                }
              }
              throw new Error(errorMessage)
            }

            return response.json()
          })()
      const currentTransform = transformRef.current
      const processedData = currentTransform ? currentTransform(rawData) : rawData

      setData(processedData)
      // Store raw data in cache so transform can be applied consistently
      setCachedData(rawData)
      setLastFetched(Date.now())
      setError(null)

      onSuccessRef.current?.(processedData as T)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, don't set error
        return
      }
      
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      onErrorRef.current?.(errorMessage)
    } finally {
      loadingRef.current = false
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [endpoint, getCachedData, setCachedData])

  // Debounced fetch function
  const debouncedFetch = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      fetchData()
    }, debounceDelay)
  }, [fetchData, debounceDelay])

  // Reset fetch guard when the cache key changes
  useEffect(() => {
    hasFetchedRef.current = false
  }, [cacheKey])

  // Auto-fetch when dependencies change
  useEffect(() => {
    if (autoFetch && !hasFetchedRef.current) {
      hasFetchedRef.current = true
      debouncedFetch()
    }
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, debouncedFetch, cacheKey, ...dependencies])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // Initialize with cached data if available
  useEffect(() => {
    const cachedData = getCachedData()
    if (cachedData && !data) {
      setData(cachedData)
    }
  }, [getCachedData, data])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    clearCache,
    lastFetched
  }
}

// Utility function to clear all caches (useful for logout)
export const clearAllCaches = () => {
  globalCache.clear()
}

// Utility function to get cache statistics
export const getCacheStats = () => {
  const now = Date.now()
  const entries = Array.from(globalCache.entries())
  
  return {
    totalEntries: entries.length,
    validEntries: entries.filter(([, entry]) => now < entry.expiresAt).length,
    expiredEntries: entries.filter(([, entry]) => now >= entry.expiresAt).length,
    totalSize: entries.reduce((acc, [, entry]) => acc + JSON.stringify(entry.data).length, 0)
  }
}

export default useSmartDataFetching
