import api from './client'
import type { BackendLoginResponse, LoginPayload } from '../types/auth'

export const loginRequest = async (payload: LoginPayload): Promise<BackendLoginResponse> => {
  const { data } = await api.post<BackendLoginResponse>('/auth/login', payload)
  return data
}

export const fetchProfile = async (): Promise<BackendLoginResponse> => {
  const { data } = await api.get<BackendLoginResponse>('/auth/me')
  return data
}
