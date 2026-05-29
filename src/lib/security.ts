import crypto from 'crypto'
import { NextRequest } from 'next/server'

// Security configuration
export const SECURITY_CONFIG = {
  // JWT settings
  JWT_EXPIRY: '24h', // Reduced from 7 days
  JWT_ISSUER: 'modern-pos',
  JWT_AUDIENCE: 'pos-users',
  
  // Rate limiting
  LOGIN_MAX_ATTEMPTS: 5,
  LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  API_MAX_REQUESTS: 100,
  API_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  
  // Password policy
  MIN_PASSWORD_LENGTH: 12,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  
  // Input validation
  MAX_INPUT_LENGTH: 1000,
  SUSPICIOUS_PATTERNS: [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS attempts
    /union\s+select/i, // SQL injection
    /eval\s*\(/i, // Code injection
    /javascript:/i, // JavaScript protocol
    /vbscript:/i, // VBScript protocol
    /on\w+\s*=/i, // Event handlers
  ]
}

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (password.length < SECURITY_CONFIG.MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters long`)
  }
  
  if (SECURITY_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (SECURITY_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (SECURITY_CONFIG.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (SECURITY_CONFIG.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  // Check for common weak passwords
  const commonPasswords = [
    'password', '123456', 'qwerty', 'admin', 'letmein',
    'welcome', 'monkey', 'dragon', 'master', 'football'
  ]
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common, please choose a stronger password')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '')
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  // Basic HTML entity encoding
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
  
  // Limit length
  if (sanitized.length > SECURITY_CONFIG.MAX_INPUT_LENGTH) {
    sanitized = sanitized.substring(0, SECURITY_CONFIG.MAX_INPUT_LENGTH)
  }
  
  return sanitized.trim()
}

// Suspicious activity detection
export const detectSuspiciousActivity = (input: string): boolean => {
  if (!input || typeof input !== 'string') {
    return false
  }
  
  return SECURITY_CONFIG.SUSPICIOUS_PATTERNS.some(pattern => pattern.test(input))
}

// Rate limiting helper
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map()
  
  constructor(
    private maxAttempts: number,
    private windowMs: number
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const record = this.attempts.get(identifier)
    
    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return true
    }
    
    if (record.count >= this.maxAttempts) {
      return false
    }
    
    record.count++
    return true
  }
  
  getRemainingAttempts(identifier: string): number {
    const record = this.attempts.get(identifier)
    if (!record) {
      return this.maxAttempts
    }
    return Math.max(0, this.maxAttempts - record.count)
  }
  
  getResetTime(identifier: string): number {
    const record = this.attempts.get(identifier)
    return record ? record.resetTime : Date.now()
  }
  
  clear(identifier: string): void {
    this.attempts.delete(identifier)
  }
}

// Encryption utilities
export const encryptField = (text: string, secretKey: string): string => {
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher('aes-256-cbc', secretKey)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Encryption failed:', error)
    throw new Error('Failed to encrypt data')
  }
}

export const decryptField = (encryptedText: string, secretKey: string): string => {
  try {
    const textParts = encryptedText.split(':')
    if (textParts.length !== 2) {
      throw new Error('Invalid encrypted text format')
    }
    
    const encrypted = textParts[1]
    const decipher = crypto.createDecipher('aes-256-cbc', secretKey)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Failed to decrypt data')
  }
}

// Hash utilities
export const hashData = (data: string, salt?: string): string => {
  const hash = crypto.createHash('sha256')
  const saltedData = salt ? data + salt : data
  return hash.update(saltedData).digest('hex')
}

// Generate secure random strings
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex')
}

// Validate JWT token format (basic validation)
export const validateJWTFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') {
    return false
  }
  
  // JWT tokens have 3 parts separated by dots
  const parts = token.split('.')
  if (parts.length !== 3) {
    return false
  }
  
  // Each part should be base64url encoded
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/
  return parts.every(part => base64UrlRegex.test(part))
}

// Security headers
export const getSecurityHeaders = () => ({
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
})

// Log security events
export const logSecurityEvent = (
  event: string,
  details: Record<string, unknown>,
  request?: NextRequest
) => {
  const logData = {
    timestamp: new Date().toISOString(),
    event,
    details,
    ip: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || 'unknown',
    userAgent: request?.headers.get('user-agent') || 'unknown',
    url: request?.url || 'unknown'
  }
  
  // In production, send to proper logging service
  console.log('SECURITY_EVENT:', JSON.stringify(logData, null, 2))
  
  // TODO: Implement proper logging service integration
  // Example: Winston, Bunyan, or cloud logging service
}

// Validate environment variables
export const validateEnvironment = (): void => {
  const requiredVars = [
    'JWT_SECRET',
    'DATABASE_URL',
    'NODE_ENV'
  ]
  
  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }
  
  // Validate JWT secret strength
  const jwtSecret = process.env.JWT_SECRET!
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long')
  }
  
  // Validate NODE_ENV
  const nodeEnv = process.env.NODE_ENV!
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be one of: development, production, test')
  }
}

// Export rate limiters for different use cases
export const loginRateLimiter = new RateLimiter(
  SECURITY_CONFIG.LOGIN_MAX_ATTEMPTS,
  SECURITY_CONFIG.LOGIN_WINDOW_MS
)

export const apiRateLimiter = new RateLimiter(
  SECURITY_CONFIG.API_MAX_REQUESTS,
  SECURITY_CONFIG.API_WINDOW_MS
)
