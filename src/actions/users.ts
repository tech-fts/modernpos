import { apiRequest, apiRequestJson, apiRequestVoid } from '@/actions/http'
import { type User, type UserRole, type UserStatus, type UsersApiResponse } from '@/types/user'

type CreateUserPayload = {
  email: string
  password: string
  role: UserRole
  status: UserStatus
}

type CreateUserResponse = {
  user: User
}

type ApiUser = Omit<User, 'createdAt'> & {
  created_at?: string
  createdAt?: string
}

type ApiUsersResponse = {
  users: ApiUser[]
}

type UpdateUserPayload = {
  email?: string
  name?: string
  role?: UserRole
  status?: UserStatus
  password?: string
}

type UpdateUserResponse = {
  user: ApiUser
}

function normalizeUser(user: ApiUser): User {
  return {
    ...user,
    createdAt: user.createdAt || user.created_at || ''
  }
}

export async function listUsers(signal?: AbortSignal): Promise<UsersApiResponse> {
  const data = await apiRequest<ApiUsersResponse>('/api/users', { signal })
  return {
    users: data.users.map(normalizeUser)
  }
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const data = await apiRequestJson<CreateUserResponse>('/api/users', 'POST', payload)
  return normalizeUser(data.user)
}

export async function updateUser(userId: string, payload: UpdateUserPayload): Promise<User> {
  const data = await apiRequestJson<UpdateUserResponse>(`/api/users/${userId}`, 'PUT', payload)
  return normalizeUser(data.user)
}

export async function deleteUser(userId: string): Promise<void> {
  await apiRequestVoid(`/api/users/${userId}`, { method: 'DELETE' })
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  await apiRequestJson<void>(`/api/users/${userId}/reset-password`, 'POST', { newPassword })
}
