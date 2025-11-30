import api from './client'
import type { User, UserCreatePayload } from '../types/user'

export const getUsers = async (): Promise<User[]> => {
  const { data } = await api.get('/users')

  if (Array.isArray(data)) {
    return data as User[]
  }

  if (Array.isArray((data as any).content)) {
    return (data as any).content as User[]
  }

  if (Array.isArray((data as any).items)) {
    return (data as any).items as User[]
  }

  return []
}

export const createUser = async (payload: UserCreatePayload): Promise<User> => {
  const { data } = await api.post<User>('/users', {
    ...payload,
    enabled: payload.enabled ?? true
  })
  return data
}
