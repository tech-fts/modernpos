import { apiRequest, apiRequestJson, apiRequestVoid } from '@/actions/http'
import { type Customer, type CustomersApiResponse } from '@/types/customer'
import {
  type OfflineCustomer,
  getOfflineCustomers,
  getOfflineCustomer,
  saveOfflineCustomers,
  generateTempId,
  isTempId,
  putOutboxItem,
  upsertOutboxItem,
  deleteStoreItem,
  getOutbox,
  deleteOutboxItem
} from '@/lib/offline-db'
import { shouldUseOffline } from '@/lib/offline-utils'

type CustomerApiResponse = {
  id: string
  name: string
  phone?: string
  email?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  createdAt: string
  totalSpent?: number | string | null
  _count?: { sales?: number }
}

const toOfflineCustomer = (customer: Customer): OfflineCustomer => ({
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

const toCustomerFromOffline = (customer: OfflineCustomer): Customer => {
  const orderCount = customer.orderCount ?? (customer as { _count?: { sales?: number } })._count?.sales ?? 0
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    zip_code: customer.zip_code,
    createdAt: customer.createdAt ?? new Date().toISOString(),
    totalSpent: Number(customer.totalSpent ?? 0),
    orderCount,
    _count: { sales: orderCount }
  }
}

export async function listCustomers(signal?: AbortSignal): Promise<CustomersApiResponse> {
  try {
    const response = await apiRequest<CustomersApiResponse>('/api/customers', { signal })
    await saveOfflineCustomers(response.customers || [])
    return response
  } catch (error) {
    if (shouldUseOffline(error)) {
      const offline = await getOfflineCustomers()
      return { customers: offline.map(toCustomerFromOffline) }
    }
    throw error
  }
}

export async function getCustomer(customerId: string): Promise<Customer> {
  try {
    const data = await apiRequest<CustomerApiResponse>(`/api/customers/${customerId}`)
    const customer: Customer = {
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      zip_code: data.zip_code || undefined,
      createdAt: data.createdAt,
      totalSpent: Number(data.totalSpent || 0),
      orderCount: data._count?.sales ?? 0
    }
    await saveOfflineCustomers([customer])
    return customer
  } catch (error) {
    if (shouldUseOffline(error)) {
      const offline = await getOfflineCustomer(customerId)
      if (!offline) throw error
      return toCustomerFromOffline(offline)
    }
    throw error
  }
}

export async function createCustomer(payload: unknown): Promise<{ id: string; phone?: string; email?: string }> {
  try {
    const created = await apiRequestJson<Customer>('/api/customers', 'POST', payload)
    await saveOfflineCustomers([toOfflineCustomer(created)])
    return { id: created.id, phone: created.phone, email: created.email }
  } catch (error) {
    if (!shouldUseOffline(error)) throw error
    const data = payload as Partial<Customer>
    const tempId = generateTempId('cust')
    const offline: Customer = {
      id: tempId,
      name: data.name || 'New Customer',
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
      state: data.state,
      zip_code: data.zip_code,
      createdAt: new Date().toISOString(),
      totalSpent: 0,
      orderCount: 0
    }
    await saveOfflineCustomers([offline])
    await putOutboxItem({
      id: generateTempId('outbox'),
      type: 'createCustomer',
      entityId: tempId,
      payload,
      createdAt: Date.now(),
      attempts: 0
    })
    return { id: tempId, phone: offline.phone, email: offline.email }
  }
}

export async function updateCustomer(customerId: string, payload: unknown): Promise<unknown> {
  try {
    const updated = await apiRequestJson<Customer>(`/api/customers/${customerId}`, 'PUT', payload)
    await saveOfflineCustomers([toOfflineCustomer(updated)])
    return updated
  } catch (error) {
    if (!shouldUseOffline(error)) throw error
    const data = payload as Partial<Customer>
    const offline: Customer = {
      id: customerId,
      name: data.name || 'Customer',
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
      state: data.state,
      zip_code: data.zip_code,
      createdAt: new Date().toISOString(),
      totalSpent: 0,
      orderCount: 0
    }
    await saveOfflineCustomers([offline])
    if (isTempId(customerId)) {
      await upsertOutboxItem(
        {
          id: generateTempId('outbox'),
          type: 'createCustomer',
          entityId: customerId,
          payload,
          createdAt: Date.now(),
          attempts: 0
        },
        (item) => item.type === 'createCustomer' && item.entityId === customerId
      )
      return offline
    }
    await putOutboxItem({
      id: generateTempId('outbox'),
      type: 'updateCustomer',
      entityId: customerId,
      payload,
      createdAt: Date.now(),
      attempts: 0
    })
    return offline
  }
}

export async function deleteCustomer(customerId: string): Promise<void> {
  try {
    await apiRequestVoid(`/api/customers/${customerId}`, { method: 'DELETE' })
    await deleteStoreItem('customers', customerId)
  } catch (error) {
    if (!shouldUseOffline(error)) throw error
    await deleteStoreItem('customers', customerId)
    if (isTempId(customerId)) {
      const outbox = await getOutbox()
      const pending = outbox.find((item) => item.type === 'createCustomer' && item.entityId === customerId)
      if (pending) await deleteOutboxItem(pending.id)
      return
    }
    await putOutboxItem({
      id: generateTempId('outbox'),
      type: 'deleteCustomer',
      entityId: customerId,
      createdAt: Date.now(),
      attempts: 0
    })
  }
}
