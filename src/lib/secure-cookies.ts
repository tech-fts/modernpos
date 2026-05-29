import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getSecurityConfig } from './security-config'

export interface SecureCookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  maxAge?: number
  path?: string
  domain?: string
}

export interface TokenCookieData {
  token: string
  userId: string
  email: string
  role: string
}

/**
 * Get environment-aware secure cookie options using centralized configuration
 */
export function getSecureCookieOptions(overrides: Partial<SecureCookieOptions> = {}): SecureCookieOptions {
  const config = getSecurityConfig()
  
  return {
    httpOnly: config.cookies.httpOnly,
    secure: config.cookies.secure,
    sameSite: config.cookies.sameSite,
    maxAge: config.cookies.maxAge,
    path: config.cookies.path,
    domain: config.cookies.domain,
    ...overrides
  }
}

/**
 * Set a secure JWT token cookie on a NextResponse
 */
export function setSecureTokenCookie(
  response: NextResponse, 
  tokenData: TokenCookieData, 
  options: Partial<SecureCookieOptions> = {}
): NextResponse {
  const cookieOptions = getSecureCookieOptions(options)
  const config = getSecurityConfig()
  
  // Set the main JWT token cookie
  response.cookies.set('auth_token', tokenData.token, cookieOptions)
  
  // Set additional user info cookies for quick access (optional, can be removed for security)
  if (config.security.enableUserInfoCookies) {
    response.cookies.set('user_id', tokenData.userId, {
      ...cookieOptions,
      maxAge: config.cookies.maxAge
    })
    
    response.cookies.set('user_role', tokenData.role, {
      ...cookieOptions,
      maxAge: config.cookies.maxAge
    })
  }
  
  return response
}

/**
 * Clear all authentication cookies from a NextResponse
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
  const cookiesToClear = ['auth_token', 'user_id', 'user_role']
  const config = getSecurityConfig()
  
  cookiesToClear.forEach(cookieName => {
    response.cookies.set(cookieName, '', {
      httpOnly: config.cookies.httpOnly,
      secure: config.cookies.secure,
      sameSite: config.cookies.sameSite,
      maxAge: 0,
      path: config.cookies.path,
      domain: config.cookies.domain
    })
  })
  
  return response
}

/**
 * Extract JWT token from request cookies
 */
export function extractTokenFromCookies(request: NextRequest): string | null {
  return request.cookies.get('auth_token')?.value || null
}

/**
 * Extract user info from request cookies (if enabled)
 */
export function extractUserInfoFromCookies(request: NextRequest): {
  userId: string | null
  role: string | null
} {
  const config = getSecurityConfig()
  
  if (!config.security.enableUserInfoCookies) {
    return { userId: null, role: null }
  }
  
  return {
    userId: request.cookies.get('user_id')?.value || null,
    role: request.cookies.get('user_role')?.value || null
  }
}

/**
 * Validate cookie security settings using centralized configuration
 */
export function validateCookieSecurity(): {
  isValid: boolean
  warnings: string[]
  recommendations: string[]
} {
  const config = getSecurityConfig()
  const warnings: string[] = []
  const recommendations: string[] = []
  
  // Check environment variables
  if (!config.jwt.secret) {
    warnings.push('JWT_SECRET is not set')
    recommendations.push('Set a strong JWT_SECRET environment variable')
  } else if (config.jwt.secret.length < 32) {
    warnings.push('JWT_SECRET is too short')
    recommendations.push('JWT_SECRET should be at least 32 characters long')
  }
  
  // Environment-specific checks
  if (process.env.NODE_ENV === 'production') {
    if (config.https.forceHttps === false) {
      warnings.push('FORCE_HTTPS is not enabled in production')
      recommendations.push('Set FORCE_HTTPS=true in production environment')
    }
    
    if (config.cookies.secure === false) {
      warnings.push('Cookies are not secure in production')
      recommendations.push('Ensure cookies are secure in production')
    }
  } else {
    if (config.https.localhostHttps === false) {
      warnings.push('LOCALHOST_HTTPS is not enabled in development')
      recommendations.push('Set LOCALHOST_HTTPS=true for secure local development')
    }
  }
  
  // Security best practices
  if (config.cookies.maxAge > 86400) { // More than 24 hours
    warnings.push('Cookie max age exceeds 24 hours')
    recommendations.push('Reduce cookie max age to 24 hours or less for security')
  }
  
  if (config.cookies.sameSite !== 'strict') {
    recommendations.push('Consider using SameSite=strict for maximum security')
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
    recommendations
  }
}

/**
 * Get cookie security status for monitoring
 */
export function getCookieSecurityStatus(): {
  status: 'secure' | 'warning' | 'insecure'
  details: string
  timestamp: string
} {
  const validation = validateCookieSecurity()
  
  if (validation.isValid) {
    return {
      status: 'secure',
      details: 'All security checks passed',
      timestamp: new Date().toISOString()
    }
  } else if (validation.warnings.length === 0) {
    return {
      status: 'warning',
      details: 'Some recommendations available',
      timestamp: new Date().toISOString()
    }
  } else {
    return {
      status: 'insecure',
      details: `Security issues detected: ${validation.warnings.join(', ')}`,
      timestamp: new Date().toISOString()
    }
  }
}
