import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { extractTokenFromCookies } from '@/lib/secure-cookies'

// Validation schema for password reset
const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters long')
})

// POST /api/users/[id]/reset-password - Reset user password (own account or admin)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    
    // Get user info from token
    const authToken = extractTokenFromCookies(request)
    if (!authToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify token and check if user is authenticated
    const decoded = await verifyToken(authToken)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const isOwnAccount = decoded.userId === userId
    const isAdmin = decoded.role === 'ADMIN'

    if (!isOwnAccount && !isAdmin) {
      return NextResponse.json(
        { error: 'You can only reset your own password' },
        { status: 403 }
      )
    }

    // Get request body
    const body = await request.json()
    
    // Validate input
    const validatedData = resetPasswordSchema.parse(body)
    const { newPassword } = validatedData

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }



    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user password
    await prisma.users.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updated_at: new Date()
      }
    })

    console.log(`✅ Password reset successful for user: ${user.email} (ID: ${userId})`)

    return NextResponse.json({
      message: 'Password reset successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Error resetting password:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
