import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { isRetryableError } from './db'

export class ProductionErrorHandler {
  static handle(error: unknown, context: string = 'Unknown operation'): NextResponse {
    console.error(`Error in ${context}:`, error)
    
    // Handle Prisma errors specifically
    if (error instanceof Error) {
      // Prisma can't reach the database (e.g., Supabase down or wrong URL)
      if (error instanceof Prisma.PrismaClientInitializationError) {
        return NextResponse.json(
          { error: 'Database connection failed. Please verify DATABASE_URL or try again shortly.' },
          { status: 503 }
        )
      }

      // Check if it's a retryable Prisma error
      if (isRetryableError(error)) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable. Please try again.' },
          { status: 503 }
        )
      }

      if (error.message.includes('prepared statement')) {
        return NextResponse.json(
          { error: 'Database connection is temporarily unavailable. Please try again shortly.' },
          { status: 503 }
        )
      }
      
      // Handle other Prisma errors
      if (error.message.includes('Unique constraint') || error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Invalid data provided. Please check your input.' },
          { status: 400 }
        )
      }
      
      // Handle connection errors
      if (error.message.includes('Connection') || error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Database temporarily unavailable. Please try again.' },
          { status: 503 }
        )
      }
      
      // Handle validation errors (avoid matching Prisma "Invalid invocation" errors)
      if (error instanceof Prisma.PrismaClientValidationError || error.message.includes('Validation')) {
        return NextResponse.json(
          { error: 'Invalid data provided. Please check your input.' },
          { status: 400 }
        )
      }
    }
    
    // Generic error response
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
  
  // Specific error handlers for common operations
  static handleDatabaseError(error: unknown, operation: string): NextResponse {
    return this.handle(error, `Database operation: ${operation}`)
  }
  
  static handleValidationError(error: unknown, operation: string): NextResponse {
    return this.handle(error, `Validation: ${operation}`)
  }
  
  static handleAuthError(error: unknown, operation: string): NextResponse {
    return this.handle(error, `Authentication: ${operation}`)
  }
}
