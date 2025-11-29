export type CredentialStatus = 'PENDING' | 'ACTIVE' | 'REVOKED' | 'EXPIRED' | string

export type Credential = {
  id: number
  publicId: string
  status: CredentialStatus
  credentialType?: string
  title?: string
  description?: string
  issuedAt?: string
  expiresAt?: string
  learnerId?: number
  learnerFullName?: string
  learnerEmail?: string
  institutionId?: number
  institutionName?: string
  issuerId?: number
  issuerUsername?: string
}

export type CredentialIssuePayload = {
  learnerId: number
  institutionId: number
  credentialType: string
  title: string
  description?: string
  // ISO date string YYYY-MM-DD
  expiresAt?: string
}

export type CredentialVerification = {
  publicId: string
  valid: boolean
  status: CredentialStatus
  message: string
  credentialType?: string
  title?: string
  learnerFullName?: string
  institutionName?: string
  issuedAt?: string
  expiresAt?: string
  revokedAt?: string
}
