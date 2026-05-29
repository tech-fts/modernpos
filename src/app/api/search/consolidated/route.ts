import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromCookies } from '@/lib/secure-cookies'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Extract and verify JWT token
    const authToken = extractTokenFromCookies(request)
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ 
        products: [], 
        customers: [], 
        sales: [] 
      })
    }

    // Parallel database queries for better performance
    const [products, customers, sales] = await Promise.all([
      // Search products
      prisma.products.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          sku: true,
          price: true
        },
        take: 3
      }),

      // Search customers
      prisma.customers.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        },
        take: 3
      }),

      // Search sales
      prisma.sales.findMany({
        where: {
          id: { contains: query, mode: 'insensitive' }
        },
        select: {
          id: true,
          total: true,
          created_at: true
        },
        take: 3,
        orderBy: { created_at: 'desc' }
      })
    ])

    return NextResponse.json({
      products,
      customers,
      sales: sales.map(sale => ({
        ...sale,
        createdAt: sale.created_at
      }))
    })

  } catch (error) {
    console.error('Consolidated search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
