import api from './client'
import type { VerificationMetrics } from '../types/metrics'

export const getVerificationSummary = async (): Promise<VerificationMetrics> => {
  const { data } = await api.get<VerificationMetrics>('/metrics/verification-summary')
  return data
}
