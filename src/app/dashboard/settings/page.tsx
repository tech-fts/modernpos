'use client'

import { useState } from 'react'
import { useSettings } from '@/contexts/SettingsContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui'
import PasswordResetModal from '@/components/PasswordResetModal'
import CacheManager from '@/components/CacheManager'

import { 
  CogIcon, 
  BellIcon,
  GlobeAltIcon,
  UserIcon,
  ArrowLeftOnRectangleIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  KeyIcon,
} from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const { addNotification } = useNotifications()
  const { user, logout } = useAuth()
  const [passwordResetModal, setPasswordResetModal] = useState<{
    isOpen: boolean
    user: { id: string; email: string; role: string } | null
  }>({
    isOpen: false,
    user: null
  })

  const handleClosePasswordResetModal = () => {
    setPasswordResetModal({
      isOpen: false,
      user: null
    })
  }

  const handleLogout = () => {
    addNotification({
      type: 'warning',
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout? This will end your current session.',
      duration: 0,
      actions: [
        {
          label: 'Cancel',
          onClick: () => {},
          variant: 'secondary'
        },
        {
          label: 'Logout',
          onClick: () => logout(),
          variant: 'danger'
        }
      ]
    })
  }

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg xs:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 xs:mt-2 md:mt-3 text-xs xs:text-sm md:text-base text-gray-700">
            Configure your POS system preferences and notifications.
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4 xs:space-y-5 sm:space-y-6">
        {/* Profile Section */}
        <Card>
          <div className="px-2.5 xs:px-3 md:px-4 lg:px-6 py-2.5 xs:py-3 md:py-4 lg:py-6">
            <div className="flex items-center mb-2.5 xs:mb-3 md:mb-4 lg:mb-5">
              <UserIcon className="h-4 w-4 xs:h-5 xs:w-5 md:h-6 md:w-6 text-blue-500 mr-2 xs:mr-2.5 md:mr-3" />
              <h3 className="text-sm xs:text-base md:text-lg lg:text-xl font-medium text-gray-900">Profile Information</h3>
            </div>
            
            <div className="space-y-2.5 xs:space-y-3 md:space-y-4">
              {/* Profile Avatar */}
              <div className="flex flex-col xs:flex-row items-center xs:items-start space-y-2.5 xs:space-y-0 xs:space-x-3 md:space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 xs:h-16 xs:w-16 md:h-20 md:w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <UserIcon className="h-6 w-6 xs:h-8 xs:w-8 md:h-10 md:w-10 text-white" />
                  </div>
                </div>
                <div className="text-center xs:text-left">
                  <h4 className="text-sm xs:text-base md:text-lg font-bold text-gray-900">{user?.role === 'ADMIN' ? 'System Administrator' : 'User'}</h4>
                  <p className="text-xs xs:text-sm text-gray-600 mt-1">Modern POS System</p>
                </div>
              </div>
              
              {/* User Details */}
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 xs:gap-3 md:gap-4">
                <div className="flex items-center space-x-2 xs:space-x-3">
                  <EnvelopeIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs xs:text-sm font-medium text-gray-500">Email</p>
                    <p className="text-xs xs:text-sm md:text-base font-medium text-gray-900 break-all">{user?.email || 'admin@modernpos.com'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 xs:space-x-3">
                  <ShieldCheckIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs xs:text-sm font-medium text-gray-500">Role</p>
                    <p className="text-xs xs:text-sm md:text-base font-medium text-gray-900 capitalize">{user?.role || 'Admin'}</p>
                  </div>
                </div>
              </div>
              
              {/* Additional Profile Info */}
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 xs:gap-3 md:gap-4">
                <div className="flex items-center space-x-2 xs:space-x-3">
                  <CogIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs xs:text-sm font-medium text-gray-500">System Access</p>
                    <p className="text-xs xs:text-sm md:text-base font-medium text-gray-900">Full Access</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 xs:space-x-3">
                  <GlobeAltIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs xs:text-sm font-medium text-gray-500">Language</p>
                    <p className="text-xs xs:text-sm md:text-base font-medium text-gray-900">English</p>
                  </div>
                </div>
              </div>
              
              {/* Session Information */}
              <div className="bg-gray-50 rounded-md p-2.5 xs:p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs xs:text-sm font-medium text-gray-700">Session Status</p>
                    <p className="text-xs xs:text-sm text-gray-600 mt-1">Active • Secure Connection</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 xs:w-3 xs:h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs xs:text-sm text-green-600 font-medium">Online</span>
                  </div>
                </div>
              </div>
              
              {/* Password Reset Button */}
              <div className="pt-2 xs:pt-3 md:pt-4 border-t border-gray-200">
                <button
                  onClick={() => setPasswordResetModal({
                    isOpen: true,
                    user: user
                  })}
                  className="group relative w-full xs:w-auto inline-flex items-center justify-center px-3 xs:px-4 md:px-5 py-2 xs:py-2.5 md:py-3 border border-blue-300 rounded-md shadow-sm text-xs xs:text-sm md:text-base font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <KeyIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 mr-1.5 xs:mr-2 md:mr-2.5" />
                  <span className="xs:hidden">Reset Password</span>
                  <span className="hidden xs:inline">Reset Password</span>
                  
                  {/* Long press text overlay for mobile S (320px) */}
                  <div className="xs:hidden absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-blue-900 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Reset Password
                  </div>
                </button>
              </div>
              
              {/* Logout Button */}
              <div className="pt-2 xs:pt-3 md:pt-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="group relative w-full xs:w-auto inline-flex items-center justify-center px-3 xs:px-4 md:px-5 py-2 xs:py-2.5 md:py-3 border border-red-300 rounded-md shadow-sm text-xs xs:text-sm md:text-base font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <ArrowLeftOnRectangleIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 mr-1.5 xs:mr-2 md:mr-2.5" />
                  <span className="xs:hidden">Logout</span>
                  <span className="hidden xs:inline">Sign Out</span>
                  
                  {/* Long press text overlay for mobile S (320px) */}
                  <div className="xs:hidden absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-red-900 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Logout
                  </div>
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Low Stock Settings - Only for non-admin users */}
        {user && user.role !== 'ADMIN' && (
          <Card>
            <div className="px-2.5 xs:px-3 md:px-4 lg:px-6 py-2.5 xs:py-3 md:py-4 lg:py-6">
              <div className="flex items-center mb-2.5 xs:mb-3 md:mb-4 lg:mb-5">
                <ExclamationTriangleIcon className="h-4 w-4 xs:h-5 xs:w-5 md:h-6 md:w-6 text-orange-500 mr-2 xs:mr-2.5 md:mr-3" />
                <h3 className="text-sm xs:text-base md:text-lg lg:text-xl font-medium text-gray-900">Low Stock Settings</h3>
              </div>
              
              <div className="space-y-2.5 xs:space-y-3 md:space-y-4">
                <div>
                  <label htmlFor="lowStockThreshold" className="block text-xs xs:text-sm md:text-base font-medium text-gray-700 mb-1 xs:mb-2">
                    Low Stock Threshold
                  </label>
                  <div className="flex items-center space-x-2 xs:space-x-3">
                    <input
                      type="number"
                      id="lowStockThreshold"
                      min="1"
                      max="100"
                      value={settings.lowStockThreshold}
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        if (!isNaN(value) && value > 0) {
                          updateSettings({ lowStockThreshold: value })
                        }
                      }}
                      className="block w-20 xs:w-24 md:w-28 px-2 xs:px-3 py-1.5 xs:py-2 border border-gray-300 rounded-md text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <span className="text-xs xs:text-sm text-gray-500">units</span>
                  </div>
                  <p className="text-xs xs:text-sm text-gray-500 mt-1">
                    Products with stock below this number will trigger low stock alerts
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* System Information - Only for non-admin users */}
        {user && user.role !== 'ADMIN' && (
          <Card>
            <div className="px-2.5 xs:px-3 md:px-4 lg:px-6 py-2.5 xs:py-3 md:py-4 lg:py-6">
              <div className="flex items-center mb-2.5 xs:mb-3 md:mb-4 lg:mb-5">
                <InformationCircleIcon className="h-4 w-4 xs:h-5 xs:w-5 md:h-6 md:w-6 text-blue-500 mr-2 xs:mr-2.5 md:mr-3" />
                <h3 className="text-sm xs:text-base md:text-lg lg:text-xl font-medium text-gray-900">System Information</h3>
              </div>
              
              <div className="space-y-2.5 xs:space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 xs:gap-3 md:gap-4">
                  <div className="flex items-center space-x-2 xs:space-x-3">
                    <CogIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs xs:text-sm font-medium text-gray-500">System Version</p>
                      <p className="text-xs xs:text-sm md:text-base font-medium text-gray-900">v2.1.0</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 xs:space-x-3">
                    <UserIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs xs:text-sm font-medium text-gray-500">User Role</p>
                      <p className="text-xs xs:text-sm md:text-base font-medium text-gray-900 capitalize">{user?.role || 'User'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Cache Manager - moved here for non-admin roles */}
        {user && user.role !== 'ADMIN' && <CacheManager />}

        {/* Notification Settings */}
        <Card>
          <div className="px-2.5 xs:px-3 md:px-4 lg:px-6 py-2.5 xs:py-3 md:py-4 lg:py-6">
            <div className="flex items-center mb-2.5 xs:mb-3 md:mb-4 lg:mb-5">
              <BellIcon className="h-4 w-4 xs:h-5 xs:w-5 md:h-6 md:w-6 text-blue-500 mr-2 xs:mr-2.5 md:mr-3" />
              <h3 className="text-sm xs:text-base md:text-lg lg:text-xl font-medium text-gray-900">Notifications</h3>
            </div>
            
            <div className="space-y-2.5 xs:space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs xs:text-sm md:text-base font-medium text-gray-700">Sales Notifications</p>
                  <p className="text-xs xs:text-sm text-gray-500 mt-1">
                    Receive alerts for new sales and transactions
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.sales}
                    onChange={(e) => updateSettings({
                      notifications: { ...settings.notifications, sales: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 xs:w-9 xs:h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] xs:after:top-[2px] after:left-[1px] xs:after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 xs:after:h-4 xs:after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs xs:text-sm md:text-base font-medium text-gray-700">Inventory Notifications</p>
                  <p className="text-xs xs:text-sm text-gray-500 mt-1">
                    Receive alerts for inventory changes and updates
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.inventory}
                    onChange={(e) => updateSettings({
                      notifications: { ...settings.notifications, inventory: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 xs:w-9 xs:h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] xs:after:top-[2px] after:left-[1px] xs:after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 xs:after:h-4 xs:after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Low Stock Notifications - Only for non-admin users */}
              {user && user.role !== 'ADMIN' && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs xs:text-sm md:text-base font-medium text-gray-700">Low Stock Notifications</p>
                    <p className="text-xs xs:text-sm text-gray-500 mt-1">
                      Receive alerts when products are running low on stock
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.lowStock}
                      onChange={(e) => updateSettings({
                        notifications: { ...settings.notifications, lowStock: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 xs:w-9 xs:h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] xs:after:top-[2px] after:left-[1px] xs:after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 xs:after:h-4 xs:after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
      
      {/* Password Reset Modal */}
      <PasswordResetModal
        isOpen={passwordResetModal.isOpen}
        onClose={handleClosePasswordResetModal}
        user={passwordResetModal.user}
      />
    </div>
  )
}
