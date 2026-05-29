export interface Settings {
  language: string
  lowStockThreshold: number
  notifications: {
    sales: boolean
    inventory: boolean
    lowStock: boolean
  }
}

