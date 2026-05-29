import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { authenticateRequest, buildUserWhereClause } from '@/lib/api-helpers'

// Validation schema for creating customers
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional()
})

// GET /api/customers - List all customers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return authResult.response as NextResponse
    }

    const baseWhere: {
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' }
        email?: { contains: string; mode: 'insensitive' }
        phone?: { contains: string; mode: 'insensitive' }
      }>
    } = {}
    
    if (search) {
      baseWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    const where = buildUserWhereClause(authResult.user!, baseWhere)

    // Get customers with sales information
    const customers = await prisma.customers.findMany({
      where,
      include: {
        _count: {
          select: {
            sales: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit
    })

    // Get total count for pagination
    const total = await prisma.customers.count({ where })

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return authResult.response as NextResponse
    }

    const userId = authResult.user!.userId
    const body = await request.json()
    
    // Validate input
    const validatedData = createCustomerSchema.parse(body)
    
    // Check if customer with same phone already exists for this user
    const existingCustomer = await prisma.customers.findFirst({
      where: { 
        phone: validatedData.phone,
        user_id: userId
      }
    })
    
    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this phone number already exists' },
        { status: 400 }
      )
    }

    // Generate a unique ID for the customer
    const customerId = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create customer
    const customer = await prisma.customers.create({
      data: {
        id: customerId,
        name: validatedData.name,
        email: validatedData.email || '',
        phone: validatedData.phone,
        address: validatedData.address || '',
        city: validatedData.city || '',
        state: validatedData.state || '',
        zip_code: validatedData.zip_code || '',
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date()
      }
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
