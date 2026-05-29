import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenEdge, JWTPayload } from '@/lib/jwt-edge'
import { logSecurityEvent, detectSuspiciousActivity } from '@/lib/security-edge'
import { clearAuthCookies, extractTokenFromCookies } from '@/lib/secure-cookies'

// Security headers for production
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
}

async function verifyTokenInMiddleware(token: string): Promise<JWTPayload | null> {
  try {
    // JWT secret must be provided via environment variable
    const secret = process.env.JWT_SECRET
    if (!secret) {
      console.error('❌ JWT_SECRET environment variable is not set')
      return null
    }
    console.log('Middleware verifying token with secret: SECRET_EXISTS')
    
    const decoded = await verifyTokenEdge(token, secret)
    if (decoded) {
      console.log('Middleware token verified successfully for user:', decoded.userId)
    } else {
      console.log('Middleware token verification failed: invalid token')
    }
    return decoded
  } catch (error) {
    console.error('Middleware JWT verification failed:', error)
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const isDev = process.env.NODE_ENV !== 'production'

  // Security check: Detect suspicious activity in URL
  if (detectSuspiciousActivity(pathname)) {
    logSecurityEvent('SUSPICIOUS_URL_ACCESS', {
      pathname,
      ip: clientIP,
      userAgent
    }, request)
    
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    )
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/', '/api/auth/login']
  
  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith('/api/auth/')
  )

  // If it's a public route, allow access with security headers
  if (isPublicRoute) {
    const response = NextResponse.next()
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    return response
  }

  // Check if user is authenticated for protected routes using DRY utility
  const authToken = extractTokenFromCookies(request)

  console.log('Middleware checking path:', pathname, 'Token exists:', !!authToken)

  if (!authToken) {
    // In development, allow navigation without forcing a login redirect to avoid dev reload loops
    if (isDev) {
      const response = NextResponse.next()
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      return response
    }

    // Log unauthorized access attempt
    logSecurityEvent('UNAUTHORIZED_ACCESS', {
      pathname,
      ip: clientIP,
      userAgent,
      reason: 'No auth token'
    }, request)
    
    // Redirect to login if no token found
    console.log('No auth token, redirecting to login')
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  try {
    // Verify the token
    const decoded = await verifyTokenInMiddleware(authToken)
    if (!decoded) {
      // Log invalid token attempt
      logSecurityEvent('UNAUTHORIZED_ACCESS', {
        pathname,
        ip: clientIP,
        userAgent,
        reason: 'Invalid token'
      }, request)
      
      // Clear invalid token and redirect to login
      console.log('Invalid token, clearing cookies and redirecting to login')
      const response = NextResponse.redirect(new URL('/login', request.url))
      
      // Clear auth cookies using centralized config
      clearAuthCookies(response)
      
      return response
    }

    // Token is valid, allow access
    console.log('✅ Token verified, allowing access to:', pathname)
    
    // Add user info to headers for API routes (optional)
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.next()
      response.headers.set('x-user-id', decoded.userId)
      response.headers.set('x-user-role', decoded.role)
      return response
    }

    return NextResponse.next()

  } catch (error) {
    console.error('Middleware error:', error)
    
    logSecurityEvent('MIDDLEWARE_ERROR', {
      pathname,
      ip: clientIP,
      userAgent,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, request)
    
    // On error, redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url))
    
    // Clear any potentially corrupted cookies using centralized config
    clearAuthCookies(response)
    
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}

