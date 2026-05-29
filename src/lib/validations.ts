import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required').optional(),
  price: z.number().positive('Price must be positive'),
  cost: z.number().positive('Cost must be positive'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  categoryId: z.string().min(1, 'Category is required')
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required')
})

export const saleItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  price: z.number().positive('Price must be positive')
})

export const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  paymentType: z.enum(['CASH', 'CARD', 'MOBILE_PAY']),
  discount: z.number().min(0, 'Discount cannot be negative'),
  customerId: z.string().optional()
})

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional()
})

export type LoginInput = z.infer<typeof loginSchema>
export type ProductInput = z.infer<typeof productSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type SaleInput = z.infer<typeof saleSchema>
export type CustomerInput = z.infer<typeof customerSchema>
