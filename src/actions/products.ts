import { apiRequest, apiRequestForm, apiRequestJson, apiRequestVoid } from '@/actions/http'
import { type ImportApiResponse } from '@/types/import'
import { type Category } from '@/types/category'
import { type ApiProduct, type ProductDetail, type ProductsApiResponse, type ProductListItem } from '@/types/product'
import { transformProductData } from '@/lib/utils'
import { listCategories } from '@/actions/categories'
import {
  type OfflineProduct,
  getOfflineProducts,
  saveOfflineProducts,
  getOfflineCategories,
  generateTempId,
  isTempId,
  putOutboxItem,
  upsertOutboxItem,
  deleteStoreItem,
  getOfflineProduct,
  getOutbox,
  deleteOutboxItem
} from '@/lib/offline-db'
import { shouldUseOffline } from '@/lib/offline-utils'

const toPrimitiveAmount = (value: OfflineProduct['price']): number | string =>
  typeof value === 'object' ? value.toString() : value

const toProductListItem = (product: OfflineProduct): ProductListItem => ({
  id: product.id,
  name: product.name,
  sku: product.sku,
  price: toPrimitiveAmount(product.price),
  cost: toPrimitiveAmount(product.cost),
  stock: product.stock,
  categories: {
    name: product.categoryName || 'Uncategorized'
  }
})

const toProductDetail = (product: OfflineProduct): ProductDetail => ({
  id: product.id,
  name: product.name,
  description: product.description || '',
  price: toPrimitiveAmount(product.price),
  cost: toPrimitiveAmount(product.cost),
  stock: product.stock,
  category: product.categoryId || '',
  sku: product.sku,
  barcode: product.barcode || ''
})

const toOfflineProduct = (product: ApiProduct): OfflineProduct => ({
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

export async function getProduct(productId: string): Promise<ProductDetail> {
  try {
    const apiProduct = await apiRequest<ApiProduct>(`/api/products/${productId}`)
    await saveOfflineProducts([toOfflineProduct(apiProduct)])
    return transformProductData(apiProduct)
  } catch (error) {
    if (shouldUseOffline(error)) {
      const offline = await getOfflineProduct(productId)
      if (!offline) throw error
      return toProductDetail(offline)
    }
    throw error
  }
}

export async function listProducts(signal?: AbortSignal): Promise<ProductsApiResponse> {
  try {
    const response = await apiRequest<ProductsApiResponse>('/api/products', { signal })
    const categories = await getOfflineCategories()
    const categoryMap = new Map(categories.map((cat) => [cat.name, cat.id]))
    const mapped = (response.products || []).map((item) => {
      const raw = item as ProductListItem & { categories?: { id?: string; name: string } }
      const categoryId = raw.categories?.id || categoryMap.get(raw.categories?.name || '')
      const offline: OfflineProduct = {
        id: raw.id,
        name: raw.name,
        sku: raw.sku,
        price: raw.price,
        cost: raw.cost,
        stock: raw.stock,
        categoryId,
        categoryName: raw.categories?.name
      }
      return offline
    })
    await saveOfflineProducts(mapped)
    return response
  } catch (error) {
    if (shouldUseOffline(error)) {
      const offline = await getOfflineProducts()
      return { products: offline.map(toProductListItem) }
    }
    throw error
  }
}

export async function listCategoriesForProducts(signal?: AbortSignal): Promise<Category[]> {
  return listCategories(signal)
}

export async function createProduct(payload: unknown): Promise<unknown> {
  try {
    const created = await apiRequestJson<ApiProduct>('/api/products', 'POST', payload)
    await saveOfflineProducts([toOfflineProduct(created)])
    return created
  } catch (error) {
    if (!shouldUseOffline(error)) throw error
    const tempId = generateTempId('prod')
    const data = payload as {
      name?: string
      sku?: string
      barcode?: string
      price?: number | string
      cost?: number | string
      stock?: number
      category_id?: string
      description?: string
    }
    const categories = await getOfflineCategories()
    const categoryName = categories.find((cat) => cat.id === data.category_id)?.name
    const offline: OfflineProduct = {
      id: tempId,
      name: data.name || 'Untitled Product',
      sku: data.sku || tempId,
      barcode: data.barcode || '',
      price: data.price ?? 0,
      cost: data.cost ?? 0,
      stock: data.stock ?? 0,
      categoryId: data.category_id,
      categoryName,
      description: data.description || ''
    }
    await saveOfflineProducts([offline])
    await putOutboxItem({
      id: generateTempId('outbox'),
      type: 'createProduct',
      entityId: tempId,
      payload,
      createdAt: Date.now(),
      attempts: 0
    })
    return offline
  }
}

export async function updateProduct(productId: string, payload: unknown): Promise<unknown> {
  try {
    const updated = await apiRequestJson<ApiProduct>(`/api/products/${productId}`, 'PUT', payload)
    await saveOfflineProducts([toOfflineProduct(updated)])
    return updated
  } catch (error) {
    if (!shouldUseOffline(error)) throw error
    const data = payload as {
      name?: string
      sku?: string
      barcode?: string
      price?: number | string
      cost?: number | string
      stock?: number
      category_id?: string
      description?: string
    }
    const categories = await getOfflineCategories()
    const categoryName = categories.find((cat) => cat.id === data.category_id)?.name
    const offline: OfflineProduct = {
      id: productId,
      name: data.name || 'Untitled Product',
      sku: data.sku || productId,
      barcode: data.barcode || '',
      price: data.price ?? 0,
      cost: data.cost ?? 0,
      stock: data.stock ?? 0,
      categoryId: data.category_id,
      categoryName,
      description: data.description || ''
    }
    await saveOfflineProducts([offline])
    if (isTempId(productId)) {
      await upsertOutboxItem(
        {
          id: generateTempId('outbox'),
          type: 'createProduct',
          entityId: productId,
          payload,
          createdAt: Date.now(),
          attempts: 0
        },
        (item) => item.type === 'createProduct' && item.entityId === productId
      )
      return offline
    }
    await putOutboxItem({
      id: generateTempId('outbox'),
      type: 'updateProduct',
      entityId: productId,
      payload,
      createdAt: Date.now(),
      attempts: 0
    })
    return offline
  }
}

export async function deleteProduct(productId: string, csrfToken?: string): Promise<void> {
  try {
    if (csrfToken) {
      await apiRequestJson<void>(`/api/products/${productId}`, 'DELETE', { csrfToken })
    } else {
      await apiRequestVoid(`/api/products/${productId}`, { method: 'DELETE' })
    }
    await deleteStoreItem('products', productId)
  } catch (error) {
    if (!shouldUseOffline(error)) throw error
    await deleteStoreItem('products', productId)
    if (isTempId(productId)) {
      const outbox = await getOutbox()
      const pending = outbox.find((item) => item.type === 'createProduct' && item.entityId === productId)
      if (pending) await deleteOutboxItem(pending.id)
      return
    }
    await putOutboxItem({
      id: generateTempId('outbox'),
      type: 'deleteProduct',
      entityId: productId,
      payload: csrfToken ? { csrfToken } : undefined,
      createdAt: Date.now(),
      attempts: 0
    })
  }
}

export async function importProducts(file: File): Promise<ImportApiResponse> {
  if (shouldUseOffline()) {
    throw new Error('Bulk import is not available offline.')
  }
  const formData = new FormData()
  formData.append('file', file)

  return apiRequestForm<ImportApiResponse>('/api/products/import', formData)
}
