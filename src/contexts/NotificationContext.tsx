'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { type Notification, type NotificationType } from '@/types/notification'
export type { Notification, NotificationAction, NotificationType } from '@/types/notification'

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }
    
    setNotifications(prev => [...prev, newNotification])

    // Auto-remove notification after duration (default: 5000ms)
    const duration = notification.duration || 5000
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-400" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-400" />
    }
  }

  const getBackgroundColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getTextColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'text-green-800'
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      case 'info':
        return 'text-blue-800'
      default:
        return 'text-blue-800'
    }
  }

  const getTitleColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'text-green-800'
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      case 'info':
        return 'text-blue-800'
      default:
        return 'text-blue-800'
    }
  }

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearNotifications }}>
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`${getBackgroundColor(notification.type)} border rounded-lg p-4 shadow-lg transition-all duration-300 ease-in-out transform translate-x-0`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getIcon(notification.type)}
              </div>
              <div className="ml-3 flex-1">
                <h3 className={`text-sm font-medium ${getTitleColor(notification.type)}`}>
                  {notification.title}
                </h3>
                <p className={`mt-1 text-sm ${getTextColor(notification.type)}`}>
                  {notification.message}
                </p>
                
                {/* Action Buttons */}
                {notification.actions && notification.actions.length > 0 && (
                  <div className="mt-3 flex space-x-2">
                    {notification.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          action.onClick()
                          removeNotification(notification.id)
                        }}
                        className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          action.variant === 'danger'
                            ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                            : action.variant === 'primary'
                            ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => removeNotification(notification.id)}
                  className={`inline-flex rounded-md ${getBackgroundColor(notification.type)} text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600`}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}
