export type BackendRole =
  | 'ROLE_SYSTEM_ADMIN'
  | 'ROLE_INSTITUTION_ADMIN'
  | 'ROLE_ISSUER'
  | 'ROLE_LEARNER'
  | 'ROLE_EMPLOYER'
  | string

export type User = {
  id: number
  username: string
  email: string
  institutionId?: number
  institutionName?: string
  roles: BackendRole[]
  enabled: boolean
  createdAt?: string
  lastLoginAt?: string
}

export type UserCreatePayload = {
  username: string
  email: string
  password: string
  institutionId: number
  roles: BackendRole[]
  enabled?: boolean
}
