import api from './client'
import type { CredentialVerification } from '../types/credential'

export const verifyCredential = async (publicId: string): Promise<CredentialVerification> => {
  const { data } = await api.get<CredentialVerification>(`/verify/${publicId}`)
  return data
}
