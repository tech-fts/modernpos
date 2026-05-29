import { apiRequest } from '@/actions/http'
import { type SecurityHealthApiResponse, type SecurityHealthData } from '@/types/security'

export async function getSecurityHealth(): Promise<SecurityHealthData> {
  const response = await apiRequest<SecurityHealthApiResponse>('/api/security/health')
  return response.data
}

