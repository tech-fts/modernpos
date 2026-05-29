import { z } from 'zod'

// Environment variable schema for production
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('Invalid DATABASE_URL'),
  
  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  
  // Security
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().url().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(100),
  
  // MFA
  MFA_ISSUER: z.string().default('Modern POS'),
  MFA_ALGORITHM: z.enum(['sha1', 'sha256', 'sha512']).default('sha1'),
  MFA_DIGITS: z.string().transform(Number).default(6),
  MFA_PERIOD: z.string().transform(Number).default(30),
  
  // Backup
  BACKUP_ENCRYPTION_KEY: z.string().min(32, 'BACKUP_ENCRYPTION_KEY must be at least 32 characters').optional(),
  CLOUD_BACKUP_ENABLED: z.string().transform(val => val === 'true').default(false),
  
  // Monitoring
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  SENTRY_DSN: z.string().url().optional(),
  
  // API Keys (for external services)
  STRIPE_SECRET_KEY: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
})

// Validate environment variables
export function validateEnv() {
  try {
    const env = envSchema.parse(process.env)
    
    // Additional security checks
    if (env.NODE_ENV === 'production') {
      if (!env.JWT_SECRET || env.JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
        throw new Error('JWT_SECRET must be changed in production')
      }
      
      if (!env.DATABASE_URL || env.DATABASE_URL.includes('dev.db')) {
        throw new Error('Production DATABASE_URL must not use development database')
      }
      
      if (env.CORS_ORIGIN === '*') {
        throw new Error('CORS_ORIGIN cannot be * in production')
      }
    }
    
    console.log('✅ Environment variables validated successfully')
    return env
  } catch (error) {
    console.error('❌ Environment validation failed:', error)
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
    
    throw error
  }
}

// Get validated environment variables
export const env = validateEnv()

// Type-safe environment access
export type Env = z.infer<typeof envSchema>
