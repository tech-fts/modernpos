import { apiRequest } from '@/actions/http'
import { type DashboardApiResponse } from '@/types/dashboard'

export async function getDashboardStats(signal?: AbortSignal): Promise<DashboardApiResponse> {
  return apiRequest<DashboardApiResponse>('/api/dashboard', { signal })
}

