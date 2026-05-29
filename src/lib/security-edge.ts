import { NextRequest } from 'next/server'

// Edge-compatible security utilities (no Node.js dependencies)
export const SECURITY_CONFIG = {
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

// Input sanitization (Edge-compatible)
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

// Log security events (Edge-compatible)
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
  
  // In Edge Runtime, we can only use console.log
  console.log('SECURITY_EVENT:', JSON.stringify(logData, null, 2))
}

// Simple rate limiting for Edge Runtime
export class EdgeRateLimiter {
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

// Export rate limiters for different use cases
export const loginRateLimiter = new EdgeRateLimiter(5, 15 * 60 * 1000) // 5 attempts per 15 minutes
export const apiRateLimiter = new EdgeRateLimiter(100, 15 * 60 * 1000) // 100 requests per 15 minutes
