'use client'

import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">You are offline</h1>
        <p className="mt-2 text-sm text-gray-600">
          The POS can keep working with your cached data. Changes will sync
          automatically when you reconnect.
        </p>
        <div className="mt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
