import api from './client'
import type { User, UserCreatePayload } from '../types/user'
import type { PageResponse } from '../types/pagination'
import type { Role } from '../types/auth'

type BackendUserDto = {
  id: number
  username: string
  email: string
  institutionId?: number
  institutionName?: string
  roles: string[]
  enabled: boolean
  createdAt?: string
  lastLoginAt?: string
}

const normalizeRoles = (backendRoles?: string[] | null): Role[] => {
  if (!backendRoles || backendRoles.length === 0) {
    return ['UNKNOWN']
  }
  const mapped: Role[] = backendRoles.map(r => {
    const v = r.toUpperCase()
    if (v.endsWith('SYSTEM_ADMIN')) return 'SYSTEM_ADMIN'
    if (v.endsWith('INSTITUTION_ADMIN')) return 'INSTITUTION_ADMIN'
    if (v.endsWith('ISSUER')) return 'ISSUER'
    if (v.endsWith('LEARNER')) return 'LEARNER'
    if (v.endsWith('EMPLOYER')) return 'EMPLOYER'
    return 'UNKNOWN'
  })
  const unique: Role[] = []
  for (const m of mapped) {
    if (!unique.includes(m)) unique.push(m)
  }
  return unique
}

const mapUserDto = (dto: BackendUserDto): User => ({
  id: dto.id,
  username: dto.username,
  email: dto.email,
  institutionId: dto.institutionId,
  institutionName: dto.institutionName,
  roles: normalizeRoles(dto.roles),
  enabled: dto.enabled,
  createdAt: dto.createdAt,
  lastLoginAt: dto.lastLoginAt
})

const roleToBackend = (role: Role): string => {
  if (role === 'UNKNOWN') return 'UNKNOWN'
  return role
}

export const getUsers = async (): Promise<User[]> => {
  const { data } = await api.get('/users')

  let raw: BackendUserDto[] = []

  if (Array.isArray(data)) {
    raw = data as BackendUserDto[]
  } else if (Array.isArray((data as any).content)) {
    raw = (data as any).content as BackendUserDto[]
  } else if (Array.isArray((data as any).items)) {
    raw = (data as any).items as BackendUserDto[]
  }

  return raw.map(mapUserDto)
}

export const getUsersPage = async (params?: {
  page?: number
  size?: number
  role?: string
  institutionId?: number
}): Promise<PageResponse<User>> => {
  const page = params?.page ?? 0
  const size = params?.size ?? 20
  const role = params?.role
  const institutionId = params?.institutionId

  const { data } = await api.get<PageResponse<BackendUserDto>>('/users', {
    params: { page, size, role, institutionId }
  })

  if (!data || !Array.isArray(data.content)) {
    return {
      content: [],
      pageNumber: 0,
      pageSize: size,
      totalElements: 0,
      totalPages: 0,
      last: true
    }
  }

  return {
    ...data,
    content: data.content.map(mapUserDto)
  }
}

export const createUser = async (payload: UserCreatePayload): Promise<User> => {
  const backendPayload = {
    username: payload.username,
    email: payload.email,
    password: payload.password,
    institutionId: payload.institutionId,
    roles: payload.roles.map(roleToBackend),
    enabled: payload.enabled ?? true
  }

  const { data } = await api.post<BackendUserDto>('/users', backendPayload)
  return mapUserDto(data)
}
