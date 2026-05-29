import { apiRequest, apiRequestForm, apiRequestJson, apiRequestVoid } from '@/actions/http'
import { type ImportApiResponse } from '@/types/import'
import { type Category } from '@/types/category'
import {
  getOfflineCategories,
  saveOfflineCategories,
  generateTempId,
  isTempId,
  putOutboxItem,
  upsertOutboxItem,
  deleteStoreItem,
  getOutbox,
  deleteOutboxItem
} from '@/lib/offline-db'
import { shouldUseOffline } from '@/lib/offline-utils'

export async function listCategories(signal?: AbortSignal): Promise<Category[]> {
  try {
    const categories = await apiRequest<Category[]>('/api/categories', { signal })
    await saveOfflineCategories(categories)
    return categories
  } catch (error) {
    if (shouldUseOffline(error)) {
      return getOfflineCategories()
    }
    throw error
  }
}

export async function getCategory(categoryId: string): Promise<Category> {
  try {
    const category = await apiRequest<Category>(`/api/categories/${categoryId}`)
    await saveOfflineCategories([category])
    return category
  } catch (error) {
    if (shouldUseOffline(error)) {
      const offline = (await getOfflineCategories()).find((item) => item.id === categoryId)
      if (!offline) throw error
      return offline
    }
    throw error
  }
}

export async function createCategory(name: string): Promise<Category> {
  try {
    const category = await apiRequestJson<Category>('/api/categories', 'POST', { name })
    await saveOfflineCategories([category])
    return category
  } catch (error) {
    if (!shouldUseOffline(error)) throw error
    const tempId = generateTempId('cat')
    const offlineCategory: Category = {
      id: tempId,
      name,
      createdAt: new Date().toISOString(),
      _count: { products: 0 }
    }
    await saveOfflineCategories([offlineCategory])
    await putOutboxItem({
      id: generateTempId('outbox'),
      type: 'createCategory',
      entityId: tempId,
      payload: { name },
      createdAt: Date.now(),
      attempts: 0
    })
    return offlineCategory
  }
}

export async function updateCategory(categoryId: string, name: string): Promise<Category> {
  try {
    const category = await apiRequestJson<Category>(`/api/categories/${categoryId}`, 'PUT', { name })
    await saveOfflineCategories([category])
    return category
  } catch (error) {
    if (!shouldUseOffline(error)) throw error
    const offlineCategory: Category = {
      id: categoryId,
      name,
      createdAt: new Date().toISOString(),
      _count: { products: 0 }
    }
    await saveOfflineCategories([offlineCategory])
    if (isTempId(categoryId)) {
      await upsertOutboxItem(
        {
          id: generateTempId('outbox'),
          type: 'createCategory',
          entityId: categoryId,
          payload: { name },
          createdAt: Date.now(),
          attempts: 0
        },
        (item) => item.type === 'createCategory' && item.entityId === categoryId
      )
      return offlineCategory
    }
    await putOutboxItem({
      id: generateTempId('outbox'),
      type: 'updateCategory',
      entityId: categoryId,
      payload: { name },
      createdAt: Date.now(),
      attempts: 0
    })
    return offlineCategory
  }
}

export async function deleteCategory(categoryId: string): Promise<void> {
  try {
    await apiRequestVoid(`/api/categories/${categoryId}`, { method: 'DELETE' })
    await deleteStoreItem('categories', categoryId)
  } catch (error) {
    if (!shouldUseOffline(error)) throw error
    await deleteStoreItem('categories', categoryId)
    if (isTempId(categoryId)) {
      const outbox = await getOutbox()
      const pending = outbox.find(
        (item) => item.type === 'createCategory' && item.entityId === categoryId
      )
      if (pending) await deleteOutboxItem(pending.id)
      return
    }
    await putOutboxItem({
      id: generateTempId('outbox'),
      type: 'deleteCategory',
      entityId: categoryId,
      createdAt: Date.now(),
      attempts: 0
    })
  }
}

export async function importCategories(file: File): Promise<ImportApiResponse> {
  const formData = new FormData()
  formData.append('file', file)

  return apiRequestForm<ImportApiResponse>('/api/categories/import', formData)
}
