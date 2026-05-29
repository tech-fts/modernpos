export interface ProductListItem {
  id: string
  name: string
  sku: string
  price: number | string
  cost: number | string
  stock: number
  categories: {
    name: string
  }
}

export interface ProductsApiResponse {
  products: ProductListItem[]
}

export interface ProductDetail {
  id: string
  name: string
  description: string
  price: number | string
  cost: number | string
  stock: number
  category: string
  sku: string
  barcode: string
}

// Product shape returned by the API (nullable fields, relational shape)
export interface ApiProduct {
  id: string
  name: string
  description?: string | null
  price: number | string
  cost: number | string
  stock: number
  sku: string
  barcode?: string | null
  categories?: {
    id: string
    name: string
  } | null
  created_at?: string | Date
  updated_at?: string | Date
}
