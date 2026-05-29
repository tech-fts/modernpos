'use client'

import React, { useState, useEffect } from 'react'
import { ShieldCheckIcon, ExclamationTriangleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { Card } from '@/components/ui'
import { type SecurityHealthData } from '@/types/security'
import { getSecurityHealth } from '@/actions/security'
import { getErrorMessage } from '@/actions/http'

interface SecurityMonitorProps {
  className?: string
}

export const SecurityMonitor: React.FC<SecurityMonitorProps> = ({ className = '' }) => {
  const [securityData, setSecurityData] = useState<SecurityHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchSecurityHealth = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data: SecurityHealthData = await getSecurityHealth()
      setSecurityData(data)
      setLastUpdated(new Date())
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to fetch security health')
      setError(errorMessage)
      console.error('Security health check error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSecurityHealth()
    
    // Refresh security status every 5 minutes
    const interval = setInterval(fetchSecurityHealth, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'secure':
        return <ShieldCheckIcon className="h-6 w-6 text-green-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
      case 'insecure':
        return <XCircleIcon className="h-6 w-6 text-red-500" />
      default:
        return <InformationCircleIcon className="h-6 w-6 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secure':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'insecure':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'secure':
        return 'All security checks passed'
      case 'warning':
        return 'Some security warnings detected'
      case 'insecure':
        return 'Security issues detected'
      default:
        return 'Security status unknown'
    }
  }

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="text-gray-600">Checking security status...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center space-x-3 text-red-600">
          <XCircleIcon className="h-6 w-6" />
          <div>
            <h3 className="font-medium">Security Check Failed</h3>
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={fetchSecurityHealth}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      </Card>
    )
  }

  if (!securityData) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <InformationCircleIcon className="h-8 w-8 mx-auto mb-2" />
          <p>No security data available</p>
        </div>
      </Card>
    )
  }

  const { cookieSecurity, validation, additionalChecks } = securityData

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Security Monitor</h2>
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated?.toLocaleTimeString() || 'Unknown'}
            </p>
          </div>
        </div>
        <button
          onClick={fetchSecurityHealth}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Overall Security Status */}
      <div className={`mb-6 p-4 rounded-lg border ${getStatusColor(cookieSecurity.status)}`}>
        <div className="flex items-center space-x-3">
          {getStatusIcon(cookieSecurity.status)}
          <div>
            <h3 className="font-medium">Overall Security Status</h3>
            <p className="text-sm">{getStatusText(cookieSecurity.status)}</p>
          </div>
        </div>
      </div>

      {/* Security Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cookie Security */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Cookie Security</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${getStatusColor(cookieSecurity.status).split(' ')[0]}`}>
                {cookieSecurity.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Check:</span>
              <span className="text-gray-900">
                {new Date(cookieSecurity.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Environment Info */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Environment</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Mode:</span>
              <span className="text-gray-900 capitalize">{additionalChecks.environment}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">HTTPS:</span>
              <span className={additionalChecks.forceHttps ? 'text-green-600' : 'text-yellow-600'}>
                {additionalChecks.forceHttps ? 'Enforced' : 'Not Enforced'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* JWT Configuration */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">JWT Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Secret Configured:</span>
            <span className={additionalChecks.hasJwtSecret ? 'text-green-600' : 'text-red-600'}>
              {additionalChecks.hasJwtSecret ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Secret Length:</span>
            <span className={additionalChecks.jwtSecretLength >= 32 ? 'text-green-600' : 'text-yellow-600'}>
              {additionalChecks.jwtSecretLength} chars
            </span>
          </div>
        </div>
      </div>

      {/* Validation Results */}
      {validation.warnings.length > 0 || validation.recommendations.length > 0 ? (
        <div className="mt-6 space-y-4">
          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2">Security Warnings</h3>
              <ul className="space-y-1 text-sm text-yellow-700">
                {validation.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {validation.recommendations.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Security Recommendations</h3>
              <ul className="space-y-1 text-sm text-blue-700">
                {validation.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <InformationCircleIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 text-green-800">
            <ShieldCheckIcon className="h-5 w-5" />
            <span className="font-medium">All security checks passed successfully!</span>
          </div>
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Security status auto-refreshes every 5 minutes
        </p>
      </div>
    </Card>
  )
}

export default SecurityMonitor
