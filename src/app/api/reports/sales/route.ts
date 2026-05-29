import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { extractTokenFromCookies } from '@/lib/secure-cookies'

// GET /api/reports/sales - Get sales data for reports
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

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today'
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    
    console.log(`API: Fetching sales report for period: ${period} for user: ${userId} (Admin: ${isAdmin})`)
    
    let startDate: Date
    let endDate: Date

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(endDateParam)
      endDate.setHours(23, 59, 59, 999)

      if (endDate < startDate) {
        const swap = startDate
        startDate = endDate
        endDate = swap
      }
    } else {
      endDate = new Date()
      // Calculate date range based on period
      switch (period) {
        case 'today':
          startDate = new Date()
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 7)
          startDate.setHours(0, 0, 0, 0)
          break
        case 'month':
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 30) // Changed from -1 month to -30 days for more data
          startDate.setHours(0, 0, 0, 0)
          break
        default:
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 30) // Default to 30 days for better chart display
          startDate.setHours(0, 0, 0, 0)
      }
    }
    
    console.log(`API: Date range - Start: ${startDate.toISOString()}, End: ${endDate.toISOString()}`)
    
    // Build where clause for filtering
    const salesWhere: {
      created_at: {
        gte: Date
        lte: Date
      }
      user_id?: string
    } = {
      created_at: {
        gte: startDate,
        lte: endDate
      }
    }
    
    // For non-admin users, filter by user_id
    if (!isAdmin) {
      salesWhere.user_id = userId
    }
    
    // Get sales data for the period
    const sales = await prisma.sales.findMany({
      where: salesWhere,
      include: {
        sale_items: {
          include: {
            products: {
              select: {
                name: true,
                sku: true,
                cost: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'asc'
      }
    })
    
    console.log(`API: Found ${sales.length} sales records`)
    if (sales.length > 0) {
      console.log(`API: First sale date: ${sales[0].created_at.toISOString()}`)
      console.log(`API: Last sale date: ${sales[sales.length - 1].created_at.toISOString()}`)
      console.log(`API: First sale total type: ${typeof sales[0].total}, value: ${sales[0].total}`)
      console.log(`API: First sale total after Number(): ${Number(sales[0].total)}`)
    }
    
    // Group sales by date/time based on period
    const salesByDate = new Map<string, { total: number; count: number }>()
    
    sales.forEach(sale => {
      let dateKey: string
      
      const isSameDay = startDate.toDateString() === endDate.toDateString()
      if (isSameDay) {
        // For today, group by hour
        const hour = sale.created_at.getHours()
        const hourStr = hour.toString().padStart(2, '0')
        dateKey = `${sale.created_at.toISOString().split('T')[0]}T${hourStr}:00:00.000Z`
      } else {
        // For week/month, group by date
        dateKey = sale.created_at.toISOString().split('T')[0]
      }
      
      const existing = salesByDate.get(dateKey) || { total: 0, count: 0 }
      existing.total += Number(sale.total) // Convert Decimal to number
      existing.count += 1
      salesByDate.set(dateKey, existing)
    })
    
    // Convert to array and sort by date
    const salesData = Array.from(salesByDate.entries())
      .map(([date, data]) => ({
        date,
        total: data.total,
        count: data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
    
    // Get top selling products
    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>()
    
    sales.forEach(sale => {
      sale.sale_items.forEach(item => {
        const productName = item.products.name
        const existing = productSales.get(productName) || { name: productName, quantity: 0, revenue: 0 }
        existing.quantity += item.quantity
        existing.revenue += Number(item.price) * item.quantity // Convert Decimal to number
        productSales.set(productName, existing)
      })
    })
    
    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
    
    // Get payment method breakdown
    const paymentMethods = new Map<string, { amount: number; count: number }>()
    
    sales.forEach(sale => {
      const method = sale.payment_type
      const existing = paymentMethods.get(method) || { amount: 0, count: 0 }
      existing.amount += Number(sale.total) // Convert Decimal to number
      existing.count += 1
      paymentMethods.set(method, existing)
    })
    
    const paymentBreakdown = Array.from(paymentMethods.entries())
      .map(([method, data]) => ({
        method: method === 'CASH' ? 'Cash' : method === 'CARD' ? 'Card' : 'Mobile Pay',
        amount: data.amount,
        count: data.count
      }))
    
    // Calculate totals
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0) // Convert Decimal to number
    const totalSales = sales.length
    const totalCost = sales.reduce((sum, sale) => (
      sum + sale.sale_items.reduce((saleSum, item) => (
        saleSum + Number(item.products.cost || 0) * item.quantity
      ), 0)
    ), 0)
    const profit = totalRevenue - totalCost
    
    const result = {
      period,
      salesData,
      topProducts,
      paymentBreakdown,
      summary: {
        totalRevenue,
        totalSales,
        profit
      }
    }
    
    console.log(`API: Returning result with ${salesData.length} data points, total revenue: ${totalRevenue}`)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Error fetching sales report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales report' },
      { status: 500 }
    )
  }
}
