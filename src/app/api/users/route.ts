import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/lib/api-helpers'
import { USER_ROLES, USER_STATUSES } from '@/types/user'

// GET /api/users - List all users (Admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response as NextResponse
    }

    const users = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        created_at: true,
        updated_at: true,
        last_login_at: true
      },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user (Admin only)
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/users: Starting user creation process')
    
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      console.log('? POST /api/users: Authentication failed')
      return authResult.response as NextResponse
    }

    console.log('✅ POST /api/users: Authentication successful, proceeding with user creation')
    
    const body = await request.json()
    console.log('🔍 POST /api/users: Request body:', { ...body, password: '[HIDDEN]' })
    
    const { email, password, role = 'USER', status = 'ACTIVE' } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!USER_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be ADMIN, USER, or MANAGER' },
        { status: 400 }
      )
    }

    if (!USER_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be ACTIVE, INACTIVE, or SUSPENDED' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate a unique ID for the user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create user
    const user = await prisma.users.create({
      data: {
        id: userId,
        email,
        password: hashedPassword,
        role,
        status,
        created_at: new Date(),
        updated_at: new Date()
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        created_at: true
      }
    })

    return NextResponse.json({ 
      message: 'User created successfully',
      user 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
