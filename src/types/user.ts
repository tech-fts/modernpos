export const USER_ROLES = ['ADMIN', 'MANAGER', 'USER'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const
export type UserStatus = (typeof USER_STATUSES)[number]

export interface User {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string
}

export interface UsersApiResponse {
  users: User[]
}
