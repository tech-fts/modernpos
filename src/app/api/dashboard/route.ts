import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { extractTokenFromCookies } from '@/lib/secure-cookies'

// GET /api/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
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
    
    console.log(`🔍 Dashboard API: User ${userId} (Admin: ${isAdmin})`)
    console.log(`🔍 Dashboard API: Filtering data for user_id: ${userId}`)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Build where clause for filtering
    const salesWhere: {
      created_at: {
        gte: Date
        lt: Date
      }
      user_id?: string
    } = {
      created_at: {
        gte: today,
        lt: tomorrow
      }
    }
    
    // For non-admin users, filter by user_id
    if (!isAdmin) {
      salesWhere.user_id = userId
    }

    // Get today's sales
    const todaySales = await prisma.sales.findMany({
      where: salesWhere
    })

    const todayRevenue = todaySales.reduce((sum, sale) => sum + Number(sale.total), 0)
    const todayCount = todaySales.length

    // Build where clauses for filtering
    const productsWhere: { user_id?: string } = {}
    const customersWhere: { user_id?: string } = {}
    const categoriesWhere: { user_id?: string } = {}
    const allSalesWhere: { user_id?: string } = {}
    
    // For non-admin users, filter by user_id
    if (!isAdmin) {
      productsWhere.user_id = userId
      customersWhere.user_id = userId
      categoriesWhere.user_id = userId
      allSalesWhere.user_id = userId
    }

    // Get total products
    const totalProducts = await prisma.products.count({ where: productsWhere })
    console.log(`🔍 Dashboard API: Products count with filter: ${totalProducts}`)

    // Get total customers
    const totalCustomers = await prisma.customers.count({ where: customersWhere })
    console.log(`🔍 Dashboard API: Customers count with filter: ${totalCustomers}`)

    // Get total categories
    const totalCategories = await prisma.categories.count({ where: categoriesWhere })
    console.log(`🔍 Dashboard API: Categories count with filter: ${totalCategories}`)

    // Get total sales count and revenue
    const totalSalesCount = await prisma.sales.count({ where: allSalesWhere })
    console.log(`🔍 Dashboard API: Sales count with filter: ${totalSalesCount}`)
    
    // Only fetch sales data if there are sales to fetch
    let totalRevenue = 0
    if (totalSalesCount > 0) {
      const allSales = await prisma.sales.findMany({
        where: allSalesWhere,
        select: {
          total: true
        }
      })
      totalRevenue = allSales.reduce((sum, sale) => sum + Number(sale.total), 0)
    }

    // Get recent sales
    const recentSales = await prisma.sales.findMany({
      where: allSalesWhere,
      take: 5,
      orderBy: {
        created_at: 'desc'
      },
      include: {
        customers: {
          select: {
            name: true
          }
        },
        users: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Get top selling products
    const topProducts = await prisma.products.findMany({
      where: productsWhere,
      take: 5,
      orderBy: {
        stock: 'asc'
      },
      select: {
        id: true,
        name: true,
        stock: true,
        price: true
      }
    })

    // Get low stock products count (only for non-admin users)
    let lowStockCount = 0
    if (!isAdmin) {
      const lowStockProducts = await prisma.products.findMany({
        where: {
          ...productsWhere,
          stock: {
            lte: 10 // Default threshold
          }
        },
        select: {
          id: true
        }
      })
      lowStockCount = lowStockProducts.length
    }

    return NextResponse.json({
      today: {
        revenue: todayRevenue,
        sales: todayCount
      },
      totals: {
        products: totalProducts,
        customers: totalCustomers,
        categories: totalCategories,
        sales: totalSalesCount,
        revenue: totalRevenue
      },
      recentSales,
      topProducts,
      lowStockCount: !isAdmin ? lowStockCount : undefined
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
