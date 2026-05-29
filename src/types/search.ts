export type SearchResultType = 'product' | 'customer' | 'sale'

export interface SearchResult {
  type: SearchResultType
  id: string
  title: string
  subtitle: string
  url: string
}

export interface ConsolidatedSearchResponse {
  products: Array<{ id: string; name: string; sku: string; price: number }>
  customers: Array<{ id: string; name: string; email?: string; phone?: string }>
  sales: Array<{ id: string; total: number; createdAt: string }>
}

