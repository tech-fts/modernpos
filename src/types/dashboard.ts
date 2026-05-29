export interface DashboardStats {
  todaySales: number
  totalProducts: number
  totalCustomers: number
  totalCategories: number
  lowStockProducts: number
}

export interface DashboardApiResponse {
  totals?: {
    products: number
    customers: number
    categories: number
  }
  today?: {
    revenue: number
  }
  lowStockCount?: number
  recentSales?: DashboardRecentSale[]
}

export interface DashboardRecentSale {
  id: string
  total: number | string
  created_at: string
  payment_status?: 'PAID' | 'NOT_PAID' | 'CASH_ON_DELIVERY'
  customers?: {
    name: string
  } | null
  users?: {
    name?: string | null
    email: string
  } | null
}
