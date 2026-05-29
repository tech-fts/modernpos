import {
  getOutbox,
  deleteOutboxItem,
  putOutboxItem,
  saveIdMap,
  replaceTempIdInOutbox,
  getIdMap,
  saveOfflineProducts,
  saveOfflineCustomers,
  saveOfflineCategories,
  saveOfflineSales,
  deleteStoreItem,
  isOnline,
  isTempId,
  type OfflineOutboxItem,
  type OfflineProduct,
  type OfflineCustomer,
  type OfflineCategory,
  type OfflineSale
} from '@/lib/offline-db'
import { apiRequest, apiRequestJson, apiRequestVoid } from '@/actions/http'
import { type ProductsApiResponse, type ApiProduct } from '@/types/product'
import { type CustomersApiResponse, type Customer } from '@/types/customer'
import { type Category } from '@/types/category'
import { type Sale } from '@/types/sale'

const sortOutbox = (items: OfflineOutboxItem[]) =>
  [...items].sort((a, b) => a.createdAt - b.createdAt)

const mapApiProductToOffline = (product: ApiProduct): OfflineProduct => ({
  id: product.id,
  name: product.name,
  sku: product.sku,
  price: product.price,
  cost: product.cost,
  stock: product.stock,
  categoryId: product.categories?.id,
  categoryName: product.categories?.name,
  description: product.description || '',
  barcode: product.barcode || ''
})

const mapCategoryToOffline = (category: Category): OfflineCategory => ({
  id: category.id,
  name: category.name,
  createdAt: category.createdAt,
  _count: category._count
})

const mapCustomerToOffline = (customer: Customer): OfflineCustomer => ({
  id: customer.id,
  name: customer.name,
  phone: customer.phone,
  email: customer.email,
  address: customer.address,
  city: customer.city,
  state: customer.state,
  zip_code: customer.zip_code,
  createdAt: customer.createdAt,
  totalSpent: customer.totalSpent,
  orderCount: customer.orderCount
})

const mapSaleToOffline = (sale: Sale): OfflineSale => ({
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

type SaleSyncItem = { product_id: string; quantity: number; price: number }

type SaleSyncPayload = {
  customer_id?: string
  items?: SaleSyncItem[]
  payment_type?: Sale['payment_type']
  payment_status?: Sale['payment_status']
  sale_channel?: Sale['sale_channel']
  discount?: number
}

const resolveMappedId = async (id?: string) => {
  if (!id || !isTempId(id)) return id
  const mapping = await getIdMap(id)
  return mapping?.realId
}

const remapSalePayload = async (payload: SaleSyncPayload): Promise<SaleSyncPayload | null> => {
  const mappedCustomer = await resolveMappedId(payload.customer_id)
  if (payload.customer_id && !mappedCustomer) return null
  const mappedItems: SaleSyncItem[] = []
  for (const item of payload.items ?? []) {
    const mappedProduct = await resolveMappedId(item.product_id)
    if (!mappedProduct) return null
    mappedItems.push({ ...item, product_id: mappedProduct })
  }
  return { ...payload, customer_id: mappedCustomer, items: mappedItems }
}

export const syncOutbox = async (): Promise<{ processed: number; skipped: number }> => {
  if (typeof window === 'undefined') return { processed: 0, skipped: 0 }
  if (!isOnline()) return { processed: 0, skipped: 0 }

  const outbox = sortOutbox(await getOutbox())
  let processed = 0
  let skipped = 0

  for (const item of outbox) {
    try {
      switch (item.type) {
        case 'createCategory': {
          const created = await apiRequestJson<Category>('/api/categories', 'POST', item.payload)
          await saveOfflineCategories([mapCategoryToOffline(created)])
          if (item.entityId) {
            await saveIdMap({ tempId: item.entityId, realId: created.id, entity: 'category' })
            await replaceTempIdInOutbox(item.entityId, created.id)
          }
          await deleteOutboxItem(item.id)
          processed += 1
          break
        }
        case 'updateCategory': {
          if (!item.entityId) break
          const updated = await apiRequestJson<Category>(
            `/api/categories/${item.entityId}`,
            'PUT',
            item.payload
          )
          await saveOfflineCategories([mapCategoryToOffline(updated)])
          await deleteOutboxItem(item.id)
          processed += 1
          break
        }
        case 'deleteCategory': {
          if (!item.entityId) break
          await apiRequestVoid(`/api/categories/${item.entityId}`, { method: 'DELETE' })
          await deleteStoreItem('categories', item.entityId)
          await deleteOutboxItem(item.id)
          processed += 1
          break
        }
        case 'createProduct': {
          const created = await apiRequest<ApiProduct>('/api/products', {
            method: 'POST',
            body: JSON.stringify(item.payload),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          })
          await saveOfflineProducts([mapApiProductToOffline(created)])
          if (item.entityId) {
            await saveIdMap({ tempId: item.entityId, realId: created.id, entity: 'product' })
            await replaceTempIdInOutbox(item.entityId, created.id)
          }
          await deleteOutboxItem(item.id)
          processed += 1
          break
        }
        case 'updateProduct': {
          if (!item.entityId) break
          const updated = await apiRequest<ApiProduct>(`/api/products/${item.entityId}`, {
            method: 'PUT',
            body: JSON.stringify(item.payload),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          })
          await saveOfflineProducts([mapApiProductToOffline(updated)])
          await deleteOutboxItem(item.id)
          processed += 1
          break
        }
        case 'deleteProduct': {
          if (!item.entityId) break
          await apiRequestVoid(`/api/products/${item.entityId}`, { method: 'DELETE' })
          await deleteStoreItem('products', item.entityId)
          await deleteOutboxItem(item.id)
          processed += 1
          break
        }
        case 'createCustomer': {
          const created = await apiRequestJson<Customer>('/api/customers', 'POST', item.payload)
          await saveOfflineCustomers([mapCustomerToOffline(created)])
          if (item.entityId) {
            await saveIdMap({ tempId: item.entityId, realId: created.id, entity: 'customer' })
            await replaceTempIdInOutbox(item.entityId, created.id)
          }
          await deleteOutboxItem(item.id)
          processed += 1
          break
        }
        case 'updateCustomer': {
          if (!item.entityId) break
          const updated = await apiRequestJson<Customer>(
            `/api/customers/${item.entityId}`,
            'PUT',
            item.payload
          )
          await saveOfflineCustomers([mapCustomerToOffline(updated)])
          await deleteOutboxItem(item.id)
          processed += 1
          break
        }
        case 'deleteCustomer': {
          if (!item.entityId) break
          await apiRequestVoid(`/api/customers/${item.entityId}`, { method: 'DELETE' })
          await deleteStoreItem('customers', item.entityId)
          await deleteOutboxItem(item.id)
          processed += 1
          break
        }
        case 'createSale': {
          if (!item.payload) break
          const payload = item.payload as SaleSyncPayload
          const mappedPayload = await remapSalePayload(payload)
          if (!mappedPayload) {
            skipped += 1
            await putOutboxItem({ ...item, attempts: item.attempts + 1 })
            break
          }
          const created = await apiRequestJson<Sale>('/api/sales', 'POST', mappedPayload)
          await saveOfflineSales([mapSaleToOffline(created)])
          if (item.entityId) {
            await saveIdMap({ tempId: item.entityId, realId: created.id, entity: 'sale' })
            await replaceTempIdInOutbox(item.entityId, created.id)
          }
          await deleteOutboxItem(item.id)
          processed += 1
          break
        }
        case 'updateSalePaymentStatus': {
          if (!item.entityId) break
          const updated = await apiRequestJson<Sale>(
            `/api/sales/${item.entityId}`,
            'PATCH',
            item.payload
          )
          await saveOfflineSales([mapSaleToOffline(updated)])
          await deleteOutboxItem(item.id)
          processed += 1
          break
        }
        case 'deleteSale': {
          if (!item.entityId) break
          await apiRequestVoid(`/api/sales/${item.entityId}`, { method: 'DELETE' })
          await deleteStoreItem('sales', item.entityId)
          await deleteOutboxItem(item.id)
          processed += 1
          break
        }
        default:
          await deleteOutboxItem(item.id)
          processed += 1
      }
    } catch {
      skipped += 1
      await putOutboxItem({ ...item, attempts: item.attempts + 1 })
    }
  }

  return { processed, skipped }
}

export const hydrateOfflineFromApi = async (): Promise<void> => {
  if (typeof window === 'undefined') return
  if (!isOnline()) return

  const [productsResponse, customersResponse, categoriesResponse, salesResponse] = await Promise.all([
    apiRequest<ProductsApiResponse>('/api/products'),
    apiRequest<CustomersApiResponse>('/api/customers'),
    apiRequest<Category[]>('/api/categories'),
    apiRequest<{ sales: Sale[] }>('/api/sales')
  ])

  const products = (productsResponse.products || []).map((product) =>
    mapApiProductToOffline(product as ApiProduct)
  )
  const customers = (customersResponse.customers || []).map(mapCustomerToOffline)
  const categories = (categoriesResponse || []).map(mapCategoryToOffline)
  const sales = (salesResponse.sales || []).map(mapSaleToOffline)

  await saveOfflineProducts(products)
  await saveOfflineCustomers(customers)
  await saveOfflineCategories(categories)
  await saveOfflineSales(sales)
}
