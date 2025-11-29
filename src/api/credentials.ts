import api from './client'
import type { Credential, CredentialIssuePayload } from '../types/credential'

export const issueCredential = async (payload: CredentialIssuePayload): Promise<Credential> => {
  // If your backend uses /credentials/issue, change the path here
  const { data } = await api.post<Credential>('/credentials', payload)
  return data
}

export const getCredentialByPublicId = async (publicId: string): Promise<Credential> => {
  const { data } = await api.get<Credential>(`/credentials/${publicId}`)
  return data
}

export const getCredentialsForLearner = async (learnerId: number): Promise<Credential[]> => {
  const { data } = await api.get<Credential[]>(`/credentials/learner/${learnerId}`)
  return data
}

export const revokeCredential = async (publicId: string): Promise<Credential> => {
  const { data } = await api.post<Credential>(`/credentials/${publicId}/revoke`)
  return data
}
