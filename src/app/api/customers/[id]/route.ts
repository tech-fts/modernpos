import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for updating customers
const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional()
})

// GET /api/customers/[id] - Get single customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const customer = await prisma.customers.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sales: true
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    // Aggregate total spent in base currency (MMK stored in DB)
    const totals = await prisma.sales.aggregate({
      where: { customer_id: id },
      _sum: { total: true }
    })

    const responseBody = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zip_code: customer.zip_code,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
      _count: customer._count,
      totalSpent: Number(totals._sum.total || 0)
    }

    return NextResponse.json(responseBody)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    console.log('PUT /api/customers/[id] - Request body:', body)
    console.log('PUT /api/customers/[id] - Customer ID:', id)
    
    // Validate input
    const validatedData = updateCustomerSchema.parse(body)
    console.log('PUT /api/customers/[id] - Validated data:', validatedData)
    
    // Check if customer exists
    const existingCustomer = await prisma.customers.findUnique({
      where: { id }
    })
    
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check if phone is being changed and if the new phone already exists
    if (validatedData.phone !== existingCustomer.phone) {
      const phoneExists = await prisma.customers.findFirst({
        where: { phone: validatedData.phone }
      })
      
      if (phoneExists) {
        return NextResponse.json(
          { error: 'Phone number already exists' },
          { status: 400 }
        )
      }
    }

    // Update customer
    const updatedCustomer = await prisma.customers.update({
      where: { id },
      data: {
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone,
        address: validatedData.address || null,
        city: validatedData.city || null,
        state: validatedData.state || null,
        zip_code: validatedData.zip_code || null
      }
    })

    return NextResponse.json(updatedCustomer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('PUT /api/customers/[id] - Validation error:', error.issues)
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if customer exists
    const existingCustomer = await prisma.customers.findUnique({
      where: { id }
    })
    
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check if customer has any sales
    const salesCount = await prisma.sales.count({
      where: { customer_id: id }
    })
    
    if (salesCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete customer that has sales history. Please archive the customer instead.' },
        { status: 400 }
      )
    }

    // Delete customer
    await prisma.customers.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}
