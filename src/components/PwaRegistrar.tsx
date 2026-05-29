'use client'

import { useEffect } from 'react'
import { syncOutbox, hydrateOfflineFromApi } from '@/lib/offline-sync'

const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  } catch {
    // Ignore registration errors to keep the app usable.
  }
}

export default function PwaRegistrar() {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  useEffect(() => {
    const handleOnline = async () => {
      await syncOutbox()
      await hydrateOfflineFromApi()
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  useEffect(() => {
    const run = async () => {
      await syncOutbox()
      await hydrateOfflineFromApi()
    }
    run()
  }, [])

  return null
}
