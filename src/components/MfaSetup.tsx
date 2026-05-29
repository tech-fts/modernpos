'use client'

import { useState } from 'react'
import { useMfa } from '@/contexts/MfaContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { ShieldCheckIcon, QrCodeIcon, KeyIcon } from '@heroicons/react/24/outline'

export default function MfaSetup() {
  const { mfaState, enableMfa, verifyMfa, generateBackupCodes } = useMfa()
  const { addNotification } = useNotifications()
  const [verificationCode, setVerificationCode] = useState('')
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  const handleEnableMfa = async () => {
    try {
      setIsSettingUp(true)
      await enableMfa()
      addNotification({
        type: 'success',
        title: 'MFA Setup Started',
        message: 'Scan the QR code with your authenticator app',
        duration: 5000
      })
    } catch (error) {
      console.error('MFA setup failed:', error)
      addNotification({
        type: 'error',
        title: 'MFA Setup Failed',
        message: 'Failed to start MFA setup',
        duration: 5000
      })
    } finally {
      setIsSettingUp(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode) return

    try {
      const success = await verifyMfa(verificationCode)
      if (success) {
        addNotification({
          type: 'success',
          title: 'MFA Verified',
          message: 'Multi-factor authentication is now active',
          duration: 5000
        })
        setVerificationCode('')
      } else {
        addNotification({
          type: 'error',
          title: 'Verification Failed',
          message: 'Invalid verification code',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('MFA verification error:', error)
      addNotification({
        type: 'error',
        title: 'Verification Error',
        message: 'Failed to verify code',
        duration: 5000
      })
    }
  }

  const handleGenerateBackupCodes = async () => {
    try {
      await generateBackupCodes()
      setShowBackupCodes(true)
      addNotification({
        type: 'success',
        title: 'Backup Codes Generated',
        message: 'Save these codes in a secure location',
        duration: 5000
      })
    } catch (error) {
      console.error('Generating backup codes failed:', error)
      addNotification({
        type: 'error',
        title: 'Backup Codes Failed',
        message: 'Failed to generate backup codes',
        duration: 5000
      })
    }
  }

  if (!mfaState.isEnabled) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ShieldCheckIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Multi-Factor Authentication</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Add an extra layer of security to your account by enabling two-factor authentication.
        </p>
        <button
          onClick={handleEnableMfa}
          disabled={isSettingUp}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSettingUp ? 'Setting up...' : 'Enable MFA'}
        </button>
      </div>
    )
  }

  if (!mfaState.isVerified) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <QrCodeIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Complete MFA Setup</h3>
        </div>
        
        {mfaState.qrCodeUrl && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
            </p>
            <div className="bg-gray-100 p-4 rounded-lg inline-block">
              <div className="w-32 h-32 bg-white flex items-center justify-center">
                <span className="text-xs text-gray-500">QR Code Placeholder</span>
              </div>
            </div>
            {mfaState.secret && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">Or enter this code manually:</p>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">{mfaState.secret}</code>
              </div>
            )}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-2">
            Verification Code
          </label>
          <input
            type="text"
            id="verification-code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter 6-digit code"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            maxLength={6}
          />
        </div>

        <button
          onClick={handleVerifyCode}
          disabled={!verificationCode || verificationCode.length !== 6}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          Verify Code
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center mb-4">
        <ShieldCheckIcon className="h-6 w-6 text-green-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">MFA Active</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Multi-factor authentication is now protecting your account.
      </p>
      
      <div className="space-y-3">
        <button
          onClick={handleGenerateBackupCodes}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <KeyIcon className="h-4 w-4 mr-2" />
          Generate Backup Codes
        </button>
      </div>

      {showBackupCodes && mfaState.backupCodes.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Backup Codes</h4>
          <p className="text-xs text-yellow-700 mb-3">
            Save these codes in a secure location. Each code can only be used once.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {mfaState.backupCodes.map((code, index) => (
              <code key={index} className="text-sm bg-white px-2 py-1 rounded border">
                {code}
              </code>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
