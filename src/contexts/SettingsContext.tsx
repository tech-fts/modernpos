'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { type Settings } from '@/types/settings'

interface SettingsContextType {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
  updateLowStockThreshold: (threshold: number) => void
}

const defaultSettings: Settings = {
  language: 'en',
  lowStockThreshold: 10,
  notifications: {
    sales: true,
    inventory: true,
    lowStock: true
  }
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  useEffect(() => {
    // Load settings from localStorage on mount
    const savedSettings = localStorage.getItem('pos-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      } catch (error) {
        console.error('Error parsing saved settings:', error)
      }
    }
  }, [])

  const updateSettings = (newSettings: Partial<Settings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    
    // Save to localStorage
    localStorage.setItem('pos-settings', JSON.stringify(updatedSettings))
  }

  const updateLowStockThreshold = (threshold: number) => {
    updateSettings({ lowStockThreshold: threshold })
  }



  return (
    <SettingsContext.Provider value={{ settings, updateSettings, updateLowStockThreshold }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
