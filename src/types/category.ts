export interface Category {
  id: string
  name: string
  createdAt?: string
  _count?: {
    products: number
  }
}
