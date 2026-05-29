import { PrismaClient, Prisma } from '@prisma/client'
import { loadEnvConfig } from '@next/env'

// Ensure environment variables are loaded when running through a custom server
// or standalone build where Next.js might not have loaded .env files yet.
const projectDir = process.cwd()
const isDevEnv = process.env.NODE_ENV !== 'production'
loadEnvConfig(projectDir, isDevEnv)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced Prisma client with connection management
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Transaction retry configuration
const TRANSACTION_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 100, // ms
  backoffMultiplier: 2,
}

// Transaction error codes that should trigger a retry
const RETRYABLE_ERROR_CODES = [
  'P2028', // Transaction not found
  'P2034', // Transaction failed due to a write conflict or a deadlock
  'P2037', // Transaction failed due to write conflict
]

// Utility function to check if an error is retryable
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRYABLE_ERROR_CODES.includes(error.code)
  }
  
  // Also retry on connection errors
  if (error instanceof Error && (error.message.includes('Connection') || error.message.includes('timeout'))) {
    return true
  }
  
  return false
}

// Enhanced transaction function with retry logic
export async function executeTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  options: {
    maxRetries?: number
    retryDelay?: number
    backoffMultiplier?: number
  } = {}
): Promise<T> {
  const config = { ...TRANSACTION_RETRY_CONFIG, ...options }
  let lastError: unknown
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await prisma.$transaction(operation, {
        timeout: 30000, // 30 second timeout
        maxWait: 10000, // 10 second max wait
      })
    } catch (error) {
      lastError = error
      
      // If it's not a retryable error or we've exhausted retries, throw
      if (!isRetryableError(error) || attempt === config.maxRetries) {
        throw error
      }
      
      // Calculate delay with exponential backoff
      const delay = config.retryDelay * Math.pow(config.backoffMultiplier, attempt)
      
      console.warn(`Transaction attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error instanceof Error ? error.message : String(error))
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // Reset connection if needed
      if (attempt > 0) {
        try {
          await prisma.$connect()
        } catch (connectError) {
          console.warn('Failed to reconnect:', connectError)
        }
      }
    }
  }
  
  throw lastError
}

// Utility function to safely close database connections
export async function closeDatabase() {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error closing database connection:', error)
  }
}

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('beforeExit', closeDatabase)
  process.on('SIGINT', closeDatabase)
  process.on('SIGTERM', closeDatabase)
}

// Test function to verify transaction functionality (development only)
export async function testTransaction() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('testTransaction is only available in development mode')
  }
  
  try {
    const result = await executeTransaction(async () => {
      // Simple test operation
      return { success: true, timestamp: new Date().toISOString() }
    })
    console.log('✅ Transaction test successful:', result)
    return result
  } catch (error) {
    console.error('❌ Transaction test failed:', error)
    throw error
  }
}
