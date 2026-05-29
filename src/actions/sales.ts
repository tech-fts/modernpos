import { apiRequest, apiRequestJson, apiRequestVoid } from '@/actions/http'
import { type Sale, type SaleCustomerSummary, type SaleProduct, type SalesApiResponse } from '@/types/sale'
import {
  type OfflineSale,
  getOfflineSales,
  saveOfflineSales,
  getOfflineProducts,
  getOfflineCustomers,
  saveOfflineProducts,
  generateTempId,
  isTempId,
  putOutboxItem,
  deleteStoreItem,
  getOutbox,
  deleteOutboxItem,
  getCachedUser
} from '@/lib/offline-db'
import { shouldUseOffline } from '@/lib/offline-utils'

type ProductsForSaleResponse = {
  products: SaleProduct[]
}

type CustomersForSaleResponse = {
  customers: SaleCustomerSummary[]
}

const toOfflineSale = (sale: Sale): OfflineSale => ({
  id: sale.id,
  total: sale.total,
  payment_type: sale.payment_type,
  payment_status: sale.payment_status,
  sale_channel: sale.sale_channel,
  discount: sale.discount,
  created_at: sale.created_at,
  users: sale.users,
  customers: sale.customers,
  sale_items: sale.sale_items
})

export async function listSales(signal?: AbortSignal): Promise<Sale[]> {
  try {
    const data = await apiRequest<SalesApiResponse>('/api/sales', { signal })
    await saveOfflineSales((data.sales || []).map(toOfflineSale))
    return data.sales || []
  } catch (error) {
    if (shouldUseOffline(error)) {
      return getOfflineSales()
    }
    throw error
  }
}

export async function listSaleProducts(): Promise<SaleProduct[]> {
  try {
    const data = await apiRequest<ProductsForSaleResponse>('/api/products')
    const offlineProducts = (data.products || []).map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      categoryId: (product.categories as { id?: string } | undefined)?.id,
      categoryName: product.categories?.name,
      description: product.description,
      barcode: product.barcode
    }))
    await saveOfflineProducts(offlineProducts)
    return data.products || []
  } catch (error) {
    if (!shouldUseOffline(error)) throw error
    const products = await getOfflineProducts()
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      barcode: product.barcode,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      categories: {
        name: product.categoryName || 'Uncategorized'
      }
    }))
  }
}

export async function listSaleCustomers(): Promise<SaleCustomerSummary[]> {
  try {
    const data = await apiRequest<CustomersForSaleResponse>('/api/customers')
    return data.customers || []
  } catch (error) {
    if (!shouldUseOffline(error)) throw error
    const customers = await getOfflineCustomers()
    return customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || ''
    }))
  }
}

export async function createSale(payload: unknown): Promise<unknown> {
  try {
    const created = await apiRequestJson<Sale>('/api/sales', 'POST', payload)
    await saveOfflineSales([toOfflineSale(created)])
    return created
  } catch (error) {
    if (!shouldUseOffline(error)) throw error
    const data = payload as {
      customer_id?: string
      items?: Array<{ product_id: string; quantity: number; price: number }>
      payment_type: Sale['payment_type']
      payment_status: Sale['payment_status']
      sale_channel: Sale['sale_channel']
      discount: number
    }
    const products = await getOfflineProducts()
    const customers = await getOfflineCustomers()
    const customer = customers.find((item) => item.id === data.customer_id)
    const saleItems = (data.items || []).map((item) => {
      const product = products.find((prod) => prod.id === item.product_id)
      return {
        quantity: item.quantity,
        price: item.price,
        products: {
          name: product?.name || 'Unknown',
          sku: product?.sku || item.product_id,
          cost: product?.cost
        }
      }
    })

    const tempId = generateTempId('sale')
    const cachedUser = getCachedUser()
    const offlineSale: OfflineSale = {
      id: tempId,
      total: (data.items || []).reduce((sum, item) => sum + item.price * item.quantity, 0) - (data.discount || 0),
      payment_type: data.payment_type,
      payment_status: data.payment_status,
      sale_channel: data.sale_channel,
      discount: data.discount || 0,
      created_at: new Date().toISOString(),
      users: { email: cachedUser.email || 'offline@local', name: cachedUser.name },
      customers: customer
        ? { name: customer.name, phone: customer.phone, email: customer.email }
        : undefined,
      sale_items: saleItems
    }

    const updatedProducts = products.map((product) => {
      const match = (data.items || []).find((item) => item.product_id === product.id)
      if (!match) return product
      return {
        ...product,
        stock: Math.max(0, product.stock - match.quantity)
      }
    })

    await saveOfflineSales([offlineSale])
    await saveOfflineProducts(updatedProducts)
    await putOutboxItem({
      id: generateTempId('outbox'),
      type: 'createSale',
      entityId: tempId,
      payload,
      createdAt: Date.now(),
      attempts: 0
    })
    return offlineSale
  }
}

export async function getSale(saleId: string): Promise<Sale> {
  try {
    const sale = await apiRequest<Sale>(`/api/sales/${saleId}`)
    await saveOfflineSales([toOfflineSale(sale)])
    return sale
  } catch (error) {
    if (shouldUseOffline(error)) {
      const sales = await getOfflineSales()
      const offline = sales.find((item) => item.id === saleId)
      if (!offline) throw error
      return offline
    }
    throw error
  }
}

export async function deleteSale(saleId: string): Promise<void> {
  try {
    await apiRequestVoid(`/api/sales/${saleId}`, { method: 'DELETE' })
    await deleteStoreItem('sales', saleId)
  } catch (error) {
    if (!shouldUseOffline(error)) throw error
    await deleteStoreItem('sales', saleId)
    if (isTempId(saleId)) {
      const outbox = await getOutbox()
      const pending = outbox.find((item) => item.type === 'createSale' && item.entityId === saleId)
      if (pending) await deleteOutboxItem(pending.id)
      return
    }
    await putOutboxItem({
      id: generateTempId('outbox'),
      type: 'deleteSale',
      entityId: saleId,
      createdAt: Date.now(),
      attempts: 0
    })
  }
}

export async function updateSalePaymentStatus(
  saleId: string,
  payment_status: 'PAID' | 'NOT_PAID' | 'CASH_ON_DELIVERY'
): Promise<Sale> {
  try {
    const updated = await apiRequestJson<Sale>(`/api/sales/${saleId}`, 'PATCH', { payment_status })
    await saveOfflineSales([toOfflineSale(updated)])
    return updated
  } catch (error) {
    if (!shouldUseOffline(error)) throw error
    const sales = await getOfflineSales()
    const existing = sales.find((sale) => sale.id === saleId)
    const cachedUser = getCachedUser()
    const updated: Sale = existing
      ? { ...existing, payment_status }
      : {
          id: saleId,
          total: 0,
          payment_type: 'CASH',
          payment_status,
          sale_channel: 'IN_STORE',
          discount: 0,
          created_at: new Date().toISOString(),
          users: { email: cachedUser.email || 'offline@local', name: cachedUser.name },
          sale_items: []
        }
    await saveOfflineSales([updated])
    await putOutboxItem({
      id: generateTempId('outbox'),
      type: 'updateSalePaymentStatus',
      entityId: saleId,
      payload: { payment_status },
      createdAt: Date.now(),
      attempts: 0
    })
    return updated
  }
}
