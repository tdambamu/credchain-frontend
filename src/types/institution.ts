export type InstitutionStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | string

export type InstitutionType =
  | 'UNIVERSITY'
  | 'COLLEGE'
  | 'SCHOOL'
  | 'TRAINING_CENTER'
  | string

export type Institution = {
  id: number
  name: string
  code: string
  type: InstitutionType
  status: InstitutionStatus
  createdAt?: string
  updatedAt?: string
}

export type InstitutionCreatePayload = {
  name: string
  code: string
  type: string
  status?: string
}
