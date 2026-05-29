import { isOfflineReady, isOnline } from '@/lib/offline-db'

export const shouldUseOffline = (error?: unknown): boolean => {
  if (!isOfflineReady()) return false
  if (!isOnline()) return true
  if (!error) return false
  return error instanceof TypeError
}
