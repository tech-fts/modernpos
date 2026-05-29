export interface ReportData {
  period: string
  salesData: Array<{
    date: string
    total: number
    count: number
  }>
  topProducts: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  paymentBreakdown: Array<{
    method: string
    amount: number
    count: number
  }>
  summary: {
    totalRevenue: number
    totalSales: number
    profit: number
  }
}

export type ReportsApiResponse = ReportData
