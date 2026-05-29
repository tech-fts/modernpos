/**
 * Security Configuration - Centralized security settings following DRY principles
 */

export interface SecurityConfig {
  jwt: {
    secret: string
    expiresIn: string
    refreshExpiresIn: string
  }
  cookies: {
    httpOnly: boolean
    secure: boolean
    sameSite: 'strict' | 'lax' | 'none'
    maxAge: number
    path: string
    domain?: string
  }
  https: {
    forceHttps: boolean
    localhostHttps: boolean
    hstsMaxAge: number
  }
  rateLimiting: {
    loginAttempts: number
    loginWindowMs: number
    generalRequests: number
    generalWindowMs: number
  }
  security: {
    enableUserInfoCookies: boolean
    enableSecurityHeaders: boolean
    enableCors: boolean
    corsOrigins: string[]
  }
}

/**
 * Get security configuration from environment variables
 */
export function getSecurityConfig(): SecurityConfig {
  const isProduction = process.env.NODE_ENV === 'production'
  const isLocalhostHttps = process.env.LOCALHOST_HTTPS === 'true'

  return {
    jwt: {
      secret: process.env.JWT_SECRET || '',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    },
    cookies: {
      httpOnly: true,
      secure: isProduction || isLocalhostHttps,
      sameSite: 'strict',
      maxAge: parseInt(process.env.COOKIE_MAX_AGE || '86400'), // 24 hours in seconds
      path: '/',
      domain: process.env.COOKIE_DOMAIN
    },
    https: {
      forceHttps: process.env.FORCE_HTTPS === 'true',
      localhostHttps: process.env.LOCALHOST_HTTPS === 'true',
      hstsMaxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000') // 1 year in seconds
    },
    rateLimiting: {
      loginAttempts: parseInt(process.env.LOGIN_RATE_LIMIT_ATTEMPTS || '5'),
      loginWindowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      generalRequests: parseInt(process.env.GENERAL_RATE_LIMIT_REQUESTS || '100'),
      generalWindowMs: parseInt(process.env.GENERAL_RATE_LIMIT_WINDOW_MS || '60000') // 1 minute
    },
    security: {
      enableUserInfoCookies: process.env.ENABLE_USER_INFO_COOKIES === 'true',
      enableSecurityHeaders: process.env.ENABLE_SECURITY_HEADERS !== 'false',
      enableCors: process.env.ENABLE_CORS === 'true',
      corsOrigins: process.env.CORS_ORIGINS?.split(',') || []
    }
  }
}

/**
 * Validate security configuration
 */
export function validateSecurityConfig(): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const config = getSecurityConfig()
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields
  if (!config.jwt.secret) {
    errors.push('JWT_SECRET is required')
  } else if (config.jwt.secret.length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters long')
  }

  // Environment-specific checks
  if (process.env.NODE_ENV === 'production') {
    if (config.https.forceHttps === false) {
      warnings.push('FORCE_HTTPS should be true in production')
    }
    
    if (config.cookies.secure === false) {
      errors.push('Cookies must be secure in production')
    }
  } else {
    if (config.https.localhostHttps === false) {
      warnings.push('LOCALHOST_HTTPS should be true for secure local development')
    }
  }

  // Security best practices
  if (config.cookies.maxAge > 86400) { // More than 24 hours
    warnings.push('Cookie max age should not exceed 24 hours for security')
  }

  if (config.rateLimiting.loginAttempts > 10) {
    warnings.push('Login rate limit attempts should not exceed 10')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Get security configuration summary for monitoring
 */
export function getSecurityConfigSummary(): {
  status: 'secure' | 'warning' | 'insecure'
  summary: string
  timestamp: string
  details: Record<string, unknown>
} {
  const config = getSecurityConfig()
  const validation = validateSecurityConfig()

  let status: 'secure' | 'warning' | 'insecure' = 'secure'
  if (validation.errors.length > 0) {
    status = 'insecure'
  } else if (validation.warnings.length > 0) {
    status = 'warning'
  }

  return {
    status,
    summary: validation.errors.length > 0 
      ? `Security issues detected: ${validation.errors.join(', ')}`
      : validation.warnings.length > 0
      ? `Security warnings: ${validation.warnings.join(', ')}`
      : 'All security checks passed',
    timestamp: new Date().toISOString(),
    details: {
      environment: process.env.NODE_ENV || 'development',
      jwtConfigured: !!config.jwt.secret,
      httpsEnabled: config.https.forceHttps,
      cookiesSecure: config.cookies.secure,
      rateLimiting: config.rateLimiting,
      securityFeatures: config.security
    }
  }
}
