import { apiRequest } from '@/actions/http'
import { type ConsolidatedSearchResponse } from '@/types/search'

export async function consolidatedSearch(query: string, signal?: AbortSignal): Promise<ConsolidatedSearchResponse> {
  const params = new URLSearchParams({ q: query }).toString()
  return apiRequest<ConsolidatedSearchResponse>(`/api/search/consolidated?${params}`, { signal })
}

