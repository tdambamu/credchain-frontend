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
