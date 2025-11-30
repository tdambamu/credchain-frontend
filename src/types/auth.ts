export type Role =
  | 'SYSTEM_ADMIN'
  | 'INSTITUTION_ADMIN'
  | 'ISSUER'
  | 'LEARNER'
  | 'EMPLOYER'
  | 'UNKNOWN'

export type AuthUser = {
  id: number | null
  username: string
  email: string
  institutionId: number | null
  institutionName?: string
  roles: Role[]
  appRole: Role
}
