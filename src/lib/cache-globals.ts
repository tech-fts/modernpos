// Global cache functions for easy access
import { clearAllCaches, getCacheStats } from '@/hooks'
import { syncOutbox } from '@/lib/offline-sync'

// Extend Window interface
declare global {
  interface Window {
    clearAllCaches: () => void
    getCacheStats: () => ReturnType<typeof getCacheStats>
    syncOutbox: () => Promise<{ processed: number; skipped: number }>
  }
}

// Add cache functions to window object
if (typeof window !== 'undefined') {
  window.clearAllCaches = clearAllCaches
  window.getCacheStats = getCacheStats
  window.syncOutbox = syncOutbox
}

export {}
