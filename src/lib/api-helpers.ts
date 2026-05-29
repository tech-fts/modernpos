import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromCookies } from '@/lib/secure-cookies'
import { verifyToken } from '@/lib/auth'

export interface AuthenticatedUser {
  userId: string
  email: string
  role: string
  isAdmin: boolean
}

/**
 * DRY Helper: Extract and verify authentication token
 * Used across all API routes to avoid code duplication
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  success: boolean
  user?: AuthenticatedUser
  response?: NextResponse
}> {
  try {
    // Extract token using DRY utility
    const authToken = extractTokenFromCookies(request)
    
    if (!authToken) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Not authenticated' },
          { status: 401 }
        )
      }
    }

    // Verify token
    const decoded = await verifyToken(authToken)
    if (!decoded) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        )
      }
    }

    return {
      success: true,
      user: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        isAdmin: decoded.role === 'ADMIN'
      }
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * DRY Helper: Check if user has admin access
 */
export async function requireAdmin(request: NextRequest): Promise<{
  success: boolean
  user?: AuthenticatedUser
  response?: NextResponse
}> {
  const authResult = await authenticateRequest(request)
  
  if (!authResult.success) {
    return authResult
  }

  if (!authResult.user?.isAdmin) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
  }

  return authResult
}

/**
 * DRY Helper: Build user-specific where clause for data filtering
 */
export type GenericWhere<T extends Record<string, unknown>> = T & { user_id?: string }

export function buildUserWhereClause<T extends Record<string, unknown>>(
  user: AuthenticatedUser,
  baseWhere: T = {} as T
): GenericWhere<T> {
  const where: GenericWhere<T> = { ...(baseWhere as T) }
  
  // For non-admin users, filter by user_id
  if (!user.isAdmin) {
    where.user_id = user.userId
  }
  
  return where
}

/**
 * DRY Helper: Standard error response
 */
export function createErrorResponse(message: string, status: number = 500): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

/**
 * DRY Helper: Standard success response
 */
export function createSuccessResponse<T>(data: T, message?: string): NextResponse {
  const response: { data: T; message?: string } = { data }
  if (message) {
    response.message = message
  }
  return NextResponse.json(response)
}

/**
 * DRY Helper: Handle common API errors
 */
export function handleApiError(error: unknown, context: string = 'API operation'): NextResponse {
  console.error(`Error in ${context}:`, error)
  
  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('Unique constraint')) {
      return createErrorResponse('Record already exists', 400)
    }
    
    if (error.message.includes('Foreign key constraint')) {
      return createErrorResponse('Invalid reference data', 400)
    }
    
    if (error.message.includes('Not found')) {
      return createErrorResponse('Record not found', 404)
    }
  }
  
  return createErrorResponse('Internal server error', 500)
}
