import type { Role } from './auth'

export type User = {
  id: number
  username: string
  email: string
  institutionId?: number
  institutionName?: string
  roles: Role[]
  enabled: boolean
  createdAt?: string
  lastLoginAt?: string
}

export type UserCreatePayload = {
  username: string
  email: string
  password: string
  institutionId: number
  roles: Role[]
  enabled?: boolean
}

export type UserUpdatePayload = {
  username: string
  email: string
  password?: string
  institutionId?: number
  roles: Role[]
  enabled?: boolean
}
