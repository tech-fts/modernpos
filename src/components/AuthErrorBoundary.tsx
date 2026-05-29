'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    // Log the error to console for debugging
    console.error('AuthErrorBoundary caught an error:', error, errorInfo)
    
    // If it's an authentication error, redirect to login
    if (error.message.includes('useAuth must be used within an AuthProvider') || 
        error.message.includes('Node cannot be found')) {
      // Use setTimeout to avoid calling router during render
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong className="font-bold">Authentication Error</strong>
              <p className="text-sm mt-1">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Go to Login
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
