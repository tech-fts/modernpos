export interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  createdAt: string
  totalSpent?: number
  orderCount?: number
  _count?: {
    sales: number
  }
}

export interface CustomersApiResponse {
  customers: Customer[]
}
