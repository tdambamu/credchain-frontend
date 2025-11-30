export type CredentialStatus =
  | 'ISSUED'
  | 'REVOKED'
  | 'EXPIRED'
  | 'PENDING'
  | string

export type Credential = {
  id: number
  publicId: string
  status: CredentialStatus
  credentialType: string
  title: string
  description?: string | null
  issuedAt?: string | null
  expiresAt?: string | null
  revokedAt?: string | null
  learnerId: number
  learnerName: string
  institutionId: number
  institutionName: string
  issuerId: number
  issuerUsername: string
}
