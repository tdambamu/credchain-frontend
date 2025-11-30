export type Role =
  | 'SYSTEM_ADMIN'
  | 'INSTITUTION_ADMIN'
  | 'ISSUER'
  | 'LEARNER'
  | 'EMPLOYER'
  | 'UNKNOWN'

export type AuthUser = {
  id: number
  username: string
  email: string
  institutionId?: number
  institutionName?: string
  roles: Role[]
  appRole: Role
}
