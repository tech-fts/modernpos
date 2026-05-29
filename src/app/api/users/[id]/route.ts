import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { verifyToken } from '@/lib/auth'
import { extractTokenFromCookies } from '@/lib/secure-cookies'

// GET /api/users/[id] - Get specific user (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Get token from cookies
    const token = extractTokenFromCookies(request)
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    // Verify token and check if user is admin
    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        name: true,
        created_at: true,
        updated_at: true,
        last_login_at: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get token from cookies
    const token = extractTokenFromCookies(request)
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    // Verify token and check if user is admin
    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { email, role, password, status, name } = body

    // Build update data object with proper typing
    const updateData: {
      email?: string
      role?: 'ADMIN' | 'USER' | 'MANAGER'
      password?: string
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
      name?: string
    } = {}
    
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role as 'ADMIN' | 'USER' | 'MANAGER'
    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, 12)
      updateData.password = hashedPassword
    }
    if (status !== undefined) updateData.status = status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
    if (name !== undefined) updateData.name = name

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        name: true,
        created_at: true,
        updated_at: true
      }
    })

    return NextResponse.json({ 
      message: 'User updated successfully',
      user: updatedUser 
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get token from cookies
    const token = extractTokenFromCookies(request)
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    // Verify token and check if user is admin
    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent admin from deleting themselves
    if (decoded.userId === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Delete user
    await prisma.users.delete({
      where: { id }
    })

    return NextResponse.json({ 
      message: 'User deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
