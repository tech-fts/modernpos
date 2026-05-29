import { env } from './env'

// Production security configuration
export const PRODUCTION_SECURITY_CONFIG = {
  // HTTPS enforcement
  FORCE_HTTPS: env.NODE_ENV === 'production',
  
  // Rate limiting (stricter in production)
  RATE_LIMITS: {
    LOGIN: { maxAttempts: 3, windowMs: 15 * 60 * 1000 }, // 3 attempts per 15 minutes
    API: { maxAttempts: env.RATE_LIMIT_MAX_REQUESTS, windowMs: env.RATE_LIMIT_WINDOW_MS },
    UPLOAD: { maxAttempts: 10, windowMs: 60 * 60 * 1000 }, // 10 uploads per hour
  },
  
  // Session security
  SESSION: {
    COOKIE_SECURE: env.NODE_ENV === 'production',
    COOKIE_HTTPONLY: true,
    COOKIE_SAMESITE: 'strict' as const,
    MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
    REFRESH_THRESHOLD: 5 * 60 * 1000, // Refresh if less than 5 minutes left
  },
  
  // Password policy (stricter in production)
  PASSWORD_POLICY: {
    MIN_LENGTH: env.NODE_ENV === 'production' ? 12 : 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: env.NODE_ENV === 'production',
    MAX_AGE_DAYS: env.NODE_ENV === 'production' ? 90 : 365, // Force change every 90 days in production
    HISTORY_COUNT: 5, // Remember last 5 passwords
  },
  
  // Input validation (stricter in production)
  INPUT_VALIDATION: {
    MAX_LENGTH: {
      TEXT: env.NODE_ENV === 'production' ? 500 : 1000,
      DESCRIPTION: env.NODE_ENV === 'production' ? 1000 : 2000,
      FILE_UPLOAD: env.NODE_ENV === 'production' ? 5 * 1024 * 1024 : 10 * 1024 * 1024, // 5MB vs 10MB
    },
    ALLOWED_FILE_TYPES: ['.csv', '.xlsx', '.pdf', '.jpg', '.png'],
    BLOCKED_PATTERNS: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
      /javascript:/gi, // JavaScript protocol
      /vbscript:/gi, // VBScript protocol
      /on\w+\s*=/gi, // Event handlers
      /union\s+select/gi, // SQL injection
      /\.\.\//, // Directory traversal
    ],
  },
  
  // Audit logging
  AUDIT_LOGGING: {
    ENABLED: env.NODE_ENV === 'production',
    LOG_LEVEL: env.LOG_LEVEL,
    SENSITIVE_FIELDS: ['password', 'token', 'secret', 'key'],
    RETENTION_DAYS: 90,
  },
  
  // Backup security
  BACKUP: {
    ENCRYPTION_ENABLED: env.NODE_ENV === 'production',
    COMPRESSION_ENABLED: true,
    MAX_BACKUPS: env.NODE_ENV === 'production' ? 30 : 7, // 30 days in production
    CLOUD_BACKUP: env.CLOUD_BACKUP_ENABLED,
  },
  
  // Monitoring and alerting
  MONITORING: {
    ENABLED: env.NODE_ENV === 'production',
    SENTRY_DSN: env.SENTRY_DSN,
    HEALTH_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes
    ALERT_THRESHOLDS: {
      ERROR_RATE: 0.05, // 5% error rate
      RESPONSE_TIME: 2000, // 2 seconds
      MEMORY_USAGE: 0.8, // 80% memory usage
    },
  },
}

// Production security middleware
export function productionSecurityMiddleware(req: Request): void {
  if (env.NODE_ENV !== 'production') return
  
  // Check for suspicious headers
  const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-forwarded-proto']
  suspiciousHeaders.forEach(header => {
    if (req.headers.get(header)) {
      console.warn(`Suspicious header detected: ${header}`)
    }
  })
  
  // Validate content type for POST requests
  if (req.method === 'POST') {
    const contentType = req.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid content type for POST request')
    }
  }
  
  // Check request size limits
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > PRODUCTION_SECURITY_CONFIG.INPUT_VALIDATION.MAX_LENGTH.FILE_UPLOAD) {
    throw new Error('Request too large')
  }
}

// Production-ready password validation
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const config = PRODUCTION_SECURITY_CONFIG.PASSWORD_POLICY
  
  if (password.length < config.MIN_LENGTH) {
    errors.push(`Password must be at least ${config.MIN_LENGTH} characters long`)
  }
  
  if (config.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (config.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (config.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (config.REQUIRE_SYMBOLS && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  // Check for common weak patterns
  const weakPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /admin/i,
    /letmein/i,
  ]
  
  if (weakPatterns.some(pattern => pattern.test(password))) {
    errors.push('Password contains common weak patterns')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Production security headers
export function getProductionSecurityHeaders(): Record<string, string> {
  const baseHeaders = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-XSS-Protection': '1; mode=block',
  }
  
  if (env.NODE_ENV === 'production') {
    return {
      ...baseHeaders,
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
      'X-Permitted-Cross-Domain-Policies': 'none',
      'X-Download-Options': 'noopen',
      'X-DNS-Prefetch-Control': 'off',
    }
  }
  
  return baseHeaders
}

