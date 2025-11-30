import api from './client'
import type { Institution, InstitutionCreatePayload } from '../types/institution'

export const getInstitutions = async (): Promise<Institution[]> => {
  const { data } = await api.get<Institution[]>('/institutions')
  return data
}

export const createInstitution = async (
  payload: InstitutionCreatePayload
): Promise<Institution> => {
  const { data } = await api.post<Institution>('/institutions', payload)
  return data
}
