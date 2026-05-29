import { apiRequest } from '@/actions/http'
import { type ReportsApiResponse } from '@/types/report'

export type SalesReportPeriod = 'today' | 'week' | 'month'
export type SalesReportQuery = {
  period?: SalesReportPeriod
  startDate?: string
  endDate?: string
}

export async function getSalesReport(
  params: SalesReportQuery,
  signal?: AbortSignal
): Promise<ReportsApiResponse> {
  const query = new URLSearchParams()
  if (params.period) query.set('period', params.period)
  if (params.startDate) query.set('startDate', params.startDate)
  if (params.endDate) query.set('endDate', params.endDate)
  return apiRequest<ReportsApiResponse>(`/api/reports/sales?${query}`, { signal })
}
