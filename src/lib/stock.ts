import { Prisma, PrismaClient } from '@prisma/client'

type TxClient = Prisma.TransactionClient | PrismaClient

export interface StockItem {
  productId: string
  variantId?: string | null
  quantity: number
}

const assertNonNegativeStock = (stock: number, context: string) => {
  if (stock < 0) {
    throw new Error(`Stock would go negative for ${context}`)
  }
}

export async function ensureStockAvailability(tx: TxClient, items: StockItem[]) {
  for (const item of items) {
    if (item.variantId) {
      throw new Error('Product variants are not supported in the current database schema')
    } else {
      const product = await tx.products.findUnique({
        where: { id: item.productId },
        select: { stock: true, sku: true }
      })
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`)
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.sku}`)
      }
    }
  }
}

export async function decrementStock(tx: TxClient, items: StockItem[]) {
  for (const item of items) {
    if (item.variantId) {
      throw new Error('Product variants are not supported in the current database schema')
    } else {
      const product = await tx.products.findUnique({
        where: { id: item.productId },
        select: { stock: true, sku: true }
      })
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`)
      }
      const newStock = product.stock - item.quantity
      assertNonNegativeStock(newStock, product.sku || item.productId)

      await tx.products.update({
        where: { id: item.productId },
        data: {
          stock: newStock,
          updated_at: new Date()
        }
      })
    }
  }
}

export async function incrementStock(tx: TxClient, items: StockItem[]) {
  for (const item of items) {
    if (item.variantId) {
      throw new Error('Product variants are not supported in the current database schema')
    } else {
      const product = await tx.products.findUnique({
        where: { id: item.productId },
        select: { stock: true }
      })
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`)
      }

      await tx.products.update({
        where: { id: item.productId },
        data: {
          stock: product.stock + item.quantity,
          updated_at: new Date()
        }
      })
    }
  }
}
