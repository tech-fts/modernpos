import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { extractTokenFromCookies } from '@/lib/secure-cookies'

const updateSaleSchema = z.object({
  payment_status: z.enum(['PAID', 'NOT_PAID', 'CASH_ON_DELIVERY'])
})

// GET /api/sales/[id] - Get single sale
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sale = await prisma.sales.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        customers: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        sale_items: {
          include: {
            products: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true
              }
            }
          }
        }
      }
    })

    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(sale)
  } catch (error) {
    console.error('Error fetching sale:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sale' },
      { status: 500 }
    )
  }
}

// PATCH /api/sales/[id] - Update sale fields (payment status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateSaleSchema.parse(body)

    const authToken = extractTokenFromCookies(request)
    if (!authToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { verifyToken } = await import('@/lib/auth')
    const decoded = await verifyToken(authToken)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const isAdmin = decoded.role === 'ADMIN'
    const userId = decoded.userId

    const existing = await prisma.sales.findUnique({
      where: { id },
      select: { id: true, user_id: true }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      )
    }

    if (!isAdmin && existing.user_id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const updated = await prisma.sales.update({
      where: { id },
      data: {
        payment_status: data.payment_status,
        updated_at: new Date()
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating sale:', error)
    return NextResponse.json(
      { error: 'Failed to update sale' },
      { status: 500 }
    )
  }
}

// DELETE /api/sales/[id] - Delete sale
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if sale exists
    const sale = await prisma.sales.findUnique({
      where: { id },
      include: {
        sale_items: {
          include: {
            products: true
          }
        }
      }
    })
    
    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      )
    }

    // Start a transaction to restore product stock and delete the sale
    await prisma.$transaction(async (tx) => {
      // Restore product stock
      for (const item of sale.sale_items) {
        await tx.products.update({
          where: { id: item.products.id },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        })
      }

      // Delete sale items first (due to foreign key constraints)
      await tx.sale_items.deleteMany({
        where: { sale_id: id }
      })

      // Delete the sale
      await tx.sales.delete({
        where: { id }
      })
    })

    return NextResponse.json({ message: 'Sale deleted successfully' })
  } catch (error) {
    console.error('Error deleting sale:', error)
    return NextResponse.json(
      { error: 'Failed to delete sale' },
      { status: 500 }
    )
  }
}
