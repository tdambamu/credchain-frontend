export type VerificationMetrics = {
  totalCount: number
  validCount: number
  revokedCount: number
  expiredCount: number
  invalidCount: number
  notFoundCount: number
  minLatencyMs: number | null
  maxLatencyMs: number | null
  avgLatencyMs: number | null
}

export type VerificationResultStatus =
  | 'VALID'
  | 'REVOKED'
  | 'EXPIRED'
  | 'INVALID'
  | 'NOT_FOUND'
  | string

export type VerificationLog = {
  id: number
  publicId: string
  resultStatus: VerificationResultStatus
  valid: boolean
  latencyMs: number
  verifiedAt: string
  credentialStatus: string
  clientIp?: string | null
  userAgent?: string | null
}
