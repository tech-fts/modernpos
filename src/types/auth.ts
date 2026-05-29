import type { UserRole } from '@/types/user'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

