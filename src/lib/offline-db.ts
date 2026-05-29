import type { Decimalish, PaymentStatus, SaleChannel } from '@/types/sale'

export type OfflineEntity = 'product' | 'customer' | 'category' | 'sale'

export type OfflineProduct = {
  id: string
  name: string
  sku: string
  price: Decimalish
  cost: Decimalish
  stock: number
  categoryId?: string
  categoryName?: string
  description?: string
  barcode?: string
}

export type OfflineCustomer = {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  createdAt?: string
  totalSpent?: number
  orderCount?: number
}

export type OfflineCategory = {
  id: string
  name: string
  createdAt?: string
  _count?: {
    products: number
  }
}

export type OfflineSale = {
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
  sale_items: Array<{
    quantity: number
    price: Decimalish
    products: {
      name: string
      sku: string
      cost?: Decimalish
    }
  }>
}

export type OfflineOutboxItem = {
  id: string
  type:
    | 'createProduct'
    | 'updateProduct'
    | 'deleteProduct'
    | 'createCustomer'
    | 'updateCustomer'
    | 'deleteCustomer'
    | 'createCategory'
    | 'updateCategory'
    | 'deleteCategory'
    | 'createSale'
    | 'updateSalePaymentStatus'
    | 'deleteSale'
  entityId?: string
  payload?: unknown
  createdAt: number
  attempts: number
}

export type OfflineIdMap = {
  tempId: string
  realId: string
  entity: OfflineEntity
}

const DB_NAME = 'modernpos-offline'
const DB_VERSION = 1

type StoreName =
  | 'products'
  | 'customers'
  | 'categories'
  | 'sales'
  | 'outbox'
  | 'meta'
  | 'idMap'

const STORE_NAMES: StoreName[] = [
  'products',
  'customers',
  'categories',
  'sales',
  'outbox',
  'meta',
  'idMap'
]

const TEMP_ID_PREFIX = 'tmp_'

const isBrowser = () => typeof window !== 'undefined' && typeof indexedDB !== 'undefined'

async function openDb(): Promise<IDBDatabase> {
  if (!isBrowser()) {
    throw new Error('IndexedDB is not available in this environment.')
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onupgradeneeded = () => {
      const db = request.result
      STORE_NAMES.forEach((store) => {
        if (db.objectStoreNames.contains(store)) return
        if (store === 'outbox') {
          db.createObjectStore(store, { keyPath: 'id' })
        } else if (store === 'meta') {
          db.createObjectStore(store, { keyPath: 'key' })
        } else if (store === 'idMap') {
          db.createObjectStore(store, { keyPath: 'tempId' })
        } else {
          db.createObjectStore(store, { keyPath: 'id' })
        }
      })
    }
    request.onsuccess = () => resolve(request.result)
  })
}

async function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    const request = handler(store)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStoreNoResult(
  storeName: StoreName,
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => void
): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    handler(store)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export const isOfflineReady = () => isBrowser()

export const isOnline = () => (typeof navigator !== 'undefined' ? navigator.onLine : true)

export const generateTempId = (prefix: string) => {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${TEMP_ID_PREFIX}${prefix}_${Date.now()}_${rand}`
}

export const isTempId = (id?: string | null) =>
  typeof id === 'string' && id.startsWith(TEMP_ID_PREFIX)

export const getAllStoreItems = async <T>(storeName: StoreName): Promise<T[]> => {
  return withStore<T[]>(storeName, 'readonly', (store) => store.getAll())
}

export const getStoreItem = async <T>(storeName: StoreName, key: string): Promise<T | undefined> => {
  return withStore<T | undefined>(storeName, 'readonly', (store) => store.get(key))
}

export const putStoreItem = async <T>(storeName: StoreName, value: T): Promise<void> => {
  await withStore(storeName, 'readwrite', (store) => store.put(value))
}

export const deleteStoreItem = async (storeName: StoreName, key: string): Promise<void> => {
  await withStore(storeName, 'readwrite', (store) => store.delete(key))
}

export const clearStore = async (storeName: StoreName): Promise<void> => {
  await withStore(storeName, 'readwrite', (store) => store.clear())
}

export const bulkPut = async <T extends { id: string }>(
  storeName: StoreName,
  values: T[]
): Promise<void> => {
  if (!values.length) return
  await withStoreNoResult(storeName, 'readwrite', (store) => {
    values.forEach((value) => {
      store.put(value)
    })
  })
}

export const getOfflineProducts = async (): Promise<OfflineProduct[]> => {
  return getAllStoreItems<OfflineProduct>('products')
}

export const getOfflineProduct = async (id: string): Promise<OfflineProduct | undefined> => {
  return getStoreItem<OfflineProduct>('products', id)
}

export const saveOfflineProducts = async (products: OfflineProduct[]): Promise<void> => {
  await bulkPut('products', products)
}

export const getOfflineCustomers = async (): Promise<OfflineCustomer[]> => {
  return getAllStoreItems<OfflineCustomer>('customers')
}

export const getOfflineCustomer = async (id: string): Promise<OfflineCustomer | undefined> => {
  return getStoreItem<OfflineCustomer>('customers', id)
}

export const saveOfflineCustomers = async (customers: OfflineCustomer[]): Promise<void> => {
  await bulkPut('customers', customers)
}

export const getOfflineCategories = async (): Promise<OfflineCategory[]> => {
  return getAllStoreItems<OfflineCategory>('categories')
}

export const getOfflineCategory = async (id: string): Promise<OfflineCategory | undefined> => {
  return getStoreItem<OfflineCategory>('categories', id)
}

export const saveOfflineCategories = async (categories: OfflineCategory[]): Promise<void> => {
  await bulkPut('categories', categories)
}

export const getOfflineSales = async (): Promise<OfflineSale[]> => {
  return getAllStoreItems<OfflineSale>('sales')
}

export const getOfflineSale = async (id: string): Promise<OfflineSale | undefined> => {
  return getStoreItem<OfflineSale>('sales', id)
}

export const saveOfflineSales = async (sales: OfflineSale[]): Promise<void> => {
  await bulkPut('sales', sales)
}

export const getOutbox = async (): Promise<OfflineOutboxItem[]> => {
  return getAllStoreItems<OfflineOutboxItem>('outbox')
}

export const putOutboxItem = async (item: OfflineOutboxItem): Promise<void> => {
  await putStoreItem('outbox', item)
}

export const deleteOutboxItem = async (id: string): Promise<void> => {
  await deleteStoreItem('outbox', id)
}

export const upsertOutboxItem = async (
  item: OfflineOutboxItem,
  match: (existing: OfflineOutboxItem) => boolean
): Promise<void> => {
  const items = await getOutbox()
  const existing = items.find(match)
  if (existing) {
    await putOutboxItem({
      ...existing,
      payload: item.payload ?? existing.payload,
      createdAt: existing.createdAt,
      attempts: existing.attempts
    })
    return
  }
  await putOutboxItem(item)
}

export const clearOutbox = async (): Promise<void> => {
  await clearStore('outbox')
}

export const saveIdMap = async (entry: OfflineIdMap): Promise<void> => {
  await putStoreItem('idMap', entry)
}

export const getIdMap = async (tempId: string): Promise<OfflineIdMap | undefined> => {
  return getStoreItem<OfflineIdMap>('idMap', tempId)
}

export const replaceTempIdInOutbox = async (tempId: string, realId: string): Promise<void> => {
  const outbox = await getOutbox()
  const updates = outbox.filter((item) => item.entityId === tempId)
  if (!updates.length) return
  await withStoreNoResult('outbox', 'readwrite', (store) => {
    updates.forEach((item) => {
      store.put({ ...item, entityId: realId })
    })
  })
}

export const getCachedUser = (): { email?: string; name?: string } => {
  if (!isBrowser()) return {}
  try {
    const cached = localStorage.getItem('cached-user')
    if (!cached) return {}
    const parsed = JSON.parse(cached) as { user?: { email?: string; name?: string } }
    return parsed.user ?? {}
  } catch {
    return {}
  }
}
