import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'
import type { Role, AuthUser } from '../types/auth'
import { getStoredToken, setStoredToken, clearStoredToken } from '../utils/storage'

type LoginResponseDto = {
  id: number
  username: string
  email: string
  institutionId?: number
  institutionName?: string
  roles: string[]
  token: string
}

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (usernameOrEmail: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

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

const pickAppRole = (roles: Role[]): Role => {
  if (!roles.length) return 'UNKNOWN'
  if (roles.includes('SYSTEM_ADMIN')) return 'SYSTEM_ADMIN'
  if (roles.includes('INSTITUTION_ADMIN')) return 'INSTITUTION_ADMIN'
  if (roles.includes('ISSUER')) return 'ISSUER'
  if (roles.includes('LEARNER')) return 'LEARNER'
  if (roles.includes('EMPLOYER')) return 'EMPLOYER'
  return roles[0]
}

const buildAuthUser = (dto: LoginResponseDto): { user: AuthUser; token: string } => {
  const normalizedRoles = normalizeRoles(dto.roles)
  const appRole = pickAppRole(normalizedRoles)
  const user: AuthUser = {
    id: dto.id,
    username: dto.username,
    email: dto.email,
    institutionId: dto.institutionId,
    institutionName: dto.institutionName,
    roles: normalizedRoles,
    appRole
  }
  return { user, token: dto.token }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(getStoredToken())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const existingToken = getStoredToken()
    if (!existingToken) {
      setUser(null)
      setToken(null)
      return
    }
    setLoading(true)
    api
      .get<LoginResponseDto>('/auth/me')
      .then(res => {
        const dto = res.data
        const normalizedRoles = normalizeRoles(dto.roles)
        const appRole = pickAppRole(normalizedRoles)
        const userFromMe: AuthUser = {
          id: dto.id,
          username: dto.username,
          email: dto.email,
          institutionId: dto.institutionId,
          institutionName: dto.institutionName,
          roles: normalizedRoles,
          appRole
        }
        setUser(userFromMe)
        setToken(existingToken)
      })
      .catch(() => {
        clearStoredToken()
        setUser(null)
        setToken(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const login = async (usernameOrEmail: string, password: string) => {
    setLoading(true)
    try {
      const { data } = await api.post<LoginResponseDto>('/auth/login', {
        usernameOrEmail,
        password
      })
      const { user: builtUser, token: newToken } = buildAuthUser(data)
      setStoredToken(newToken)
      setUser(builtUser)
      setToken(newToken)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    clearStoredToken()
    setUser(null)
    setToken(null)
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  const value: AuthContextValue = {
    user,
    token,
    loading,
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
