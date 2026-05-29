import { NextRequest, NextResponse } from 'next/server'
import { getCookieSecurityStatus, validateCookieSecurity } from '@/lib/secure-cookies'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated (this will use our secure cookie system)
    const authToken = request.cookies.get('auth_token')?.value
    
    if (!authToken) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Authentication required to view security status'
        },
        { status: 401 }
      )
    }

    // Get security status using DRY utility
    const securityStatus = getCookieSecurityStatus()
    const validation = validateCookieSecurity()

    // Additional security checks
    const additionalChecks = {
      environment: process.env.NODE_ENV || 'development',
      hasJwtSecret: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
      forceHttps: process.env.FORCE_HTTPS === 'true',
      localhostHttps: process.env.LOCALHOST_HTTPS === 'true',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      status: 'success',
      message: 'Security health check completed',
      data: {
        cookieSecurity: securityStatus,
        validation: validation,
        additionalChecks: additionalChecks,
        recommendations: validation.recommendations,
        warnings: validation.warnings
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Security health check error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to complete security health check'
      },
      { status: 500 }
    )
  }
}
