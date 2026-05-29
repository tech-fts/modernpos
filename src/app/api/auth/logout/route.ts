import { NextResponse } from 'next/server'
import { clearAuthCookies } from '@/lib/secure-cookies'

export async function POST() {
  try {
    // Create response
    const response = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    )

    // Clear all authentication cookies using DRY utility
    clearAuthCookies(response)

    console.log('🍪 Authentication cookies cleared successfully')
    return response

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
