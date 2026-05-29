'use client'

import { useState, useCallback, useMemo } from 'react'

interface UseSearchOptions<T> {
  data: T[]
  searchFields: (keyof T)[]
  debounceMs?: number
  minSearchLength?: number
}

export const useSearch = <T>({
  data,
  searchFields,
  debounceMs = 300,
  minSearchLength = 1
}: UseSearchOptions<T>) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  // Debounce search term
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    
    if (value.length >= minSearchLength) {
      const timeoutId = setTimeout(() => {
        setDebouncedSearchTerm(value)
      }, debounceMs)
      
      return () => clearTimeout(timeoutId)
    } else {
      setDebouncedSearchTerm('')
    }
  }, [debounceMs, minSearchLength])

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < minSearchLength) {
      return data
    }

    const searchLower = debouncedSearchTerm.toLowerCase()
    
    return data.filter(item => 
      searchFields.some(field => {
        const value = item[field]
        if (value === null || value === undefined) return false
        
        const stringValue = String(value).toLowerCase()
        return stringValue.includes(searchLower)
      })
    )
  }, [data, debouncedSearchTerm, searchFields, minSearchLength])

  const clearSearch = useCallback(() => {
    setSearchTerm('')
    setDebouncedSearchTerm('')
  }, [])

  return {
    searchTerm,
    debouncedSearchTerm,
    filteredData,
    handleSearchChange,
    clearSearch,
    isSearching: debouncedSearchTerm.length >= minSearchLength
  }
}

export default useSearch
