export type Role = 'ADMIN' | 'ISSUER' | 'LEARNER' | 'VERIFIER' | 'UNKNOWN'

export type BackendRole = string

export type AuthUser = {
  id: number
  username: string
  email: string
  institutionId: number | null
  institutionName: string | null
  roles: BackendRole[]
  appRole: Role
}

export type LoginPayload = {
  usernameOrEmail: string
  password: string
}

export type BackendLoginResponse = {
  id: number
  username: string
  email: string
  institutionId: number | null
  institutionName: string | null
  roles: BackendRole[]
  token: string
}
