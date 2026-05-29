import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { ProductionErrorHandler } from '@/lib/error-handler'
import { extractTokenFromCookies } from '@/lib/secure-cookies'
import { executeTransaction } from '@/lib/db'
import { prisma } from '@/lib/db'
import { ensureStockAvailability, decrementStock } from '@/lib/stock'

type PaymentStatus = 'PAID' | 'NOT_PAID' | 'CASH_ON_DELIVERY'
type SaleChannel = 'IN_STORE' | 'ONLINE'

const numeric = (label: string) =>
  z.preprocess((val) => {
    if (typeof val === 'string') {
      const parsed = parseFloat(val)
      return isNaN(parsed) ? val : parsed
    }
    return val
  }, z.number().positive(`${label} must be positive`))

const integer = (label: string) =>
  z.preprocess((val) => {
    if (typeof val === 'string') {
      const parsed = parseInt(val, 10)
      return isNaN(parsed) ? val : parsed
    }
    return val
  }, z.number().int().positive(`${label} must be positive`))

const resolvePaymentStatus = ({
  saleChannel,
  paymentType,
  paymentStatus
}: {
  saleChannel: SaleChannel
  paymentType: 'CASH' | 'CARD' | 'MOBILE_PAY'
  paymentStatus?: PaymentStatus
}): PaymentStatus => {
  if (saleChannel === 'IN_STORE') {
    return 'PAID'
  }

  if (paymentStatus) {
    return paymentStatus
  }

  if (paymentType === 'CASH') {
    return 'CASH_ON_DELIVERY'
  }

  return 'NOT_PAID'
}

// Validation schema for creating sales
const createSaleSchema = z.object({
  customer_id: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().min(1, 'Product is required'),
    variant_id: z.string().optional(),
    quantity: integer('Quantity'),
    price: numeric('Price')
  })).min(1, 'At least one item is required'),
  payment_type: z.enum(['CASH', 'CARD', 'MOBILE_PAY']).default('CASH'),
  payment_status: z.enum(['PAID', 'NOT_PAID', 'CASH_ON_DELIVERY']).optional(),
  sale_channel: z.enum(['IN_STORE', 'ONLINE']).default('IN_STORE'),
  discount: z.preprocess((val) => {
    if (typeof val === 'string') {
      const parsed = parseFloat(val)
      return isNaN(parsed) ? val : parsed
    }
    return val
  }, z.number().min(0, 'Discount must be non-negative')).default(0)
})

// GET /api/sales - List all sales
export async function GET(request: NextRequest) {
  try {
  const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get user info from token
    const authToken = extractTokenFromCookies(request)
    if (!authToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Import and verify token
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

    // Build where clause for filtering
    const where: { user_id?: string } = {}
    
    // For non-admin users, filter by user_id
    if (!isAdmin) {
      where.user_id = userId
    }

    // Get sales with related information
    const sales = await prisma.sales.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            email: true
          }
        },
        customers: {
          select: {
            id: true,
            name: true
          }
        },
        sale_items: {
          include: {
            products: {
              select: {
                id: true,
                name: true,
                sku: true,
                cost: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit
    })

    // Get total count for pagination
    const total = await prisma.sales.count({ where })

    return NextResponse.json({
      sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return ProductionErrorHandler.handleDatabaseError(error, 'fetching sales')
  }
}

// POST /api/sales - Create new sale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // CSRF Protection
    const csrfToken = body.csrfToken
    if (!csrfToken) {
      return NextResponse.json(
        { error: 'CSRF token is required' },
        { status: 403 }
      )
    }
    
    // For now, we'll just check if the token exists and has the right format
    // In a real implementation, you'd validate against a stored session token
    if (typeof csrfToken !== 'string' || csrfToken.length !== 64) {
      return NextResponse.json(
        { error: 'Invalid CSRF token format' },
        { status: 403 }
      )
    }
    
         // Get user info from token
     const authToken = extractTokenFromCookies(request)
    if (!authToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Import and verify token
    const { verifyToken } = await import('@/lib/auth')
    const decoded = await verifyToken(authToken)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = decoded.userId
    
    // Validate input
    const validatedData = createSaleSchema.parse(body)
    
    // Calculate total
    const total = validatedData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) - validatedData.discount
    const resolvedPaymentStatus = resolvePaymentStatus({
      saleChannel: validatedData.sale_channel,
      paymentType: validatedData.payment_type,
      paymentStatus: validatedData.payment_status
    })

    // Build stock items without variant_id to stay compatible with unmigrated DBs
    const stockItems = validatedData.items.map(item => ({
      productId: item.product_id,
      variantId: undefined,
      quantity: item.quantity
    }))

    // Start a transaction with enhanced error handling and retry logic
    const result = await executeTransaction(async (tx) => {
      await ensureStockAvailability(tx, stockItems)

      const saleData = {
        id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        total,
        payment_type: validatedData.payment_type,
        payment_status: resolvedPaymentStatus,
        sale_channel: validatedData.sale_channel,
        discount: validatedData.discount,
        customer_id: validatedData.customer_id || null,
        user_id: userId, // Use the authenticated user ID
        created_at: new Date(),
        updated_at: new Date(),
        sale_items: {
          create: validatedData.items.map(item => ({
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            user_id: userId,
            created_at: new Date()
          }))
        }
      } satisfies Prisma.salesCreateArgs['data']

      const sale = await tx.sales.create({
        data: saleData,
        include: {
          sale_items: {
            include: {
              products: true
            }
          },
          customers: true
        }
      })

      await decrementStock(tx, stockItems)
      return sale
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    // Use the enhanced error handler for consistent error responses
    return ProductionErrorHandler.handleDatabaseError(error, 'creating sale')
  }
}
