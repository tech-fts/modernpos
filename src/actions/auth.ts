import { ApiError, apiRequest, apiRequestJson, apiRequestVoid } from '@/actions/http'
import { type AuthUser } from '@/types/auth'

type MeResponse = {
  user?: AuthUser
}

export async function getCurrentUser(signal?: AbortSignal): Promise<AuthUser | null> {
  try {
    const data = await apiRequest<MeResponse>('/api/auth/me', {
      credentials: 'include',
      signal
    })
    return data.user ?? null
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

type LoginResponse = {
  user?: AuthUser
  message?: string
}

export async function login(email: string, password: string): Promise<AuthUser | null> {
  try {
    const data = await apiRequestJson<LoginResponse>(
      '/api/auth/login',
      'POST',
      { email, password },
      { credentials: 'include' }
    )

    return data.user ?? null
  } catch (error) {
    if (error instanceof ApiError) return null
    throw error
  }
}

export async function logout(): Promise<void> {
  await apiRequestVoid('/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  })
}
