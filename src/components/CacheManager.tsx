'use client'

import { useState, useEffect } from 'react'
import { getCacheStats, clearAllCaches } from '@/hooks'
import { Card } from '@/components/ui'

interface CacheStats {
  totalEntries: number
  validEntries: number
  expiredEntries: number
  totalSize: number
}

export default function CacheManager() {
  const [stats, setStats] = useState<CacheStats>({
    totalEntries: 0,
    validEntries: 0,
    expiredEntries: 0,
    totalSize: 0
  })
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const updateStats = () => {
    setStats(getCacheStats())
    setLastUpdated(new Date())
  }

  const handleClearCache = () => {
    clearAllCaches()
    updateStats()
  }

  useEffect(() => {
    updateStats()
    
    // Update stats every 10 seconds
    const interval = setInterval(updateStats, 10000)
    
    return () => clearInterval(interval)
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className="p-2 xs:p-3 sm:p-4">
      {/* Mobile S (320px) - Compact header with icon-only buttons */}
      <div className="flex items-center justify-between mb-3 xs:mb-4">
        <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-900">Cache Manager</h3>
        <div className="flex space-x-1 xs:space-x-2">
          <button
            onClick={updateStats}
            className="group relative p-1.5 xs:px-2 xs:py-1 text-xs xs:text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            title="Refresh Cache Stats"
          >
            <svg className="h-3 w-3 xs:h-4 xs:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {/* Long press text overlay for mobile S */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-gray-900 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Refresh
            </div>
          </button>
          <button
            onClick={handleClearCache}
            className="group relative p-1.5 xs:px-2 xs:py-1 text-xs xs:text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            title="Clear All Caches"
          >
            <svg className="h-3 w-3 xs:h-4 xs:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {/* Long press text overlay for mobile S */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-gray-900 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Clear All
            </div>
          </button>
        </div>
      </div>

      {/* Mobile S (320px) - Single column layout, Tablet+ (768px) - 2 columns, Desktop (1024px+) - 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 mb-3 xs:mb-4">
        <div className="text-center p-2 xs:p-3 bg-blue-50 rounded-lg">
          <div className="text-lg xs:text-xl sm:text-2xl font-bold text-blue-600">{stats.totalEntries}</div>
          <div className="text-[10px] xs:text-xs sm:text-sm text-gray-600">Total Entries</div>
        </div>
        <div className="text-center p-2 xs:p-3 bg-green-50 rounded-lg">
          <div className="text-lg xs:text-xl sm:text-2xl font-bold text-green-600">{stats.validEntries}</div>
          <div className="text-[10px] xs:text-xs sm:text-sm text-gray-600">Valid</div>
        </div>
        <div className="text-center p-2 xs:p-3 bg-orange-50 rounded-lg">
          <div className="text-lg xs:text-xl sm:text-2xl font-bold text-orange-600">{stats.expiredEntries}</div>
          <div className="text-[10px] xs:text-xs sm:text-sm text-gray-600">Expired</div>
        </div>
        <div className="text-center p-2 xs:p-3 bg-purple-50 rounded-lg">
          <div className="text-lg xs:text-xl sm:text-2xl font-bold text-purple-600">{formatBytes(stats.totalSize)}</div>
          <div className="text-[10px] xs:text-xs sm:text-sm text-gray-600">Total Size</div>
        </div>
      </div>

      <div className="text-[9px] xs:text-xs text-gray-500 text-center mb-2 xs:mb-3">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>

      {/* Mobile S (320px) - Collapsible benefits section */}
      <details className="group">
        <summary className="cursor-pointer text-[10px] xs:text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors">
          <span className="group-open:hidden">Cache Benefits ▼</span>
          <span className="hidden group-open:inline">Cache Benefits ▲</span>
        </summary>
        <div className="mt-2 p-2 xs:p-3 bg-gray-50 rounded-md">
          <ul className="text-[9px] xs:text-xs text-gray-600 space-y-0.5 xs:space-y-1">
            <li>• Reduces API calls by 70-90%</li>
            <li>• Improves page load performance</li>
            <li>• Reduces server load</li>
            <li>• Better user experience</li>
          </ul>
        </div>
      </details>
    </Card>
  )
}
