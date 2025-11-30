import api from './client'
import type { Credential } from '../types/credential'

export type IssueCredentialPayload = {
  learnerId: number
  institutionId: number
  issuerUserId: number
  credentialType: string
  title: string
  description?: string
  expiresAt?: string | null
}

export const issueCredential = async (
  payload: IssueCredentialPayload
): Promise<Credential> => {
  const { data } = await api.post<Credential>('/credentials', payload)
  return data
}

export const getCredentialByPublicId = async (
  publicId: string
): Promise<Credential> => {
  const { data } = await api.get<Credential>(`/credentials/${publicId}`)
  return data
}

export const getCredentialsByLearner = async (
  learnerId: number
): Promise<Credential[]> => {
  const { data } = await api.get<Credential[]>(
    `/credentials/learner/${learnerId}`
  )
  return data
}

export const revokeCredential = async (
  publicId: string
): Promise<Credential> => {
  const { data } = await api.post<Credential>(`/credentials/${publicId}/revoke`)
  return data
}
