import api from './client'
import type { VerificationMetrics, VerificationLog } from '../types/metrics'
import type { PageResponse } from '../types/pagination'

export const getVerificationSummary = async (): Promise<VerificationMetrics> => {
  const { data } = await api.get<VerificationMetrics>('/metrics/verification-summary')
  return data
}

export const getVerificationLogs = async (
  params?: { page?: number; size?: number }
): Promise<PageResponse<VerificationLog>> => {
  const page = params?.page ?? 0
  const size = params?.size ?? 100

  const { data } = await api.get<PageResponse<VerificationLog>>('/metrics/verification-logs', {
    params: { page, size }
  })

  return data
}
