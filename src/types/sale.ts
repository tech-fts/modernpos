export type Decimalish = number | string | { toString(): string }
export type PaymentStatus = 'PAID' | 'NOT_PAID' | 'CASH_ON_DELIVERY'
export type SaleChannel = 'IN_STORE' | 'ONLINE'

export interface SaleItem {
  quantity: number
  price: Decimalish
  products: {
    name: string
    sku: string
    cost?: Decimalish
  }
}

export interface Sale {
  id: string
  total: Decimalish
  payment_type: string
  payment_status: PaymentStatus
  sale_channel: SaleChannel
  discount: Decimalish
  created_at: string
  users: {
    email: string
    name?: string
  }
  customers?: {
    name: string
    phone?: string
    email?: string
  }
  sale_items: SaleItem[]
}

export interface SalesApiResponse {
  sales: Sale[]
}

export interface SaleProduct {
  id: string
  name: string
  description?: string
  sku: string
  barcode?: string
  price: Decimalish
  cost: Decimalish
  stock: number
  categories: {
    name: string
  }
}

export interface SaleCustomerSummary {
  id: string
  name: string
  phone: string
}

export interface CartItem {
  productId: string
  name: string
  sku: string
  price: number
  quantity: number
  stock: number
}
