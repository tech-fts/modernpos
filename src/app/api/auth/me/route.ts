import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { extractTokenFromCookies } from '@/lib/secure-cookies'

export async function GET(request: NextRequest) {
  try {
    // Extract token using DRY utility
    const authToken = extractTokenFromCookies(request)

    if (!authToken) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(authToken)
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      }
    })

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
