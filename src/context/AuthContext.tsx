import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'
import type { Role, AuthUser } from '../types/auth'

type LoginResponseDto = {
  id?: number
  userId?: number
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

const TOKEN_KEY = 'credchain_token'

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

const buildAuthUser = (
  data: LoginResponseDto
): { user: AuthUser; token: string } => {
  const token = data.token
  const id = data.id ?? (data as any).userId ?? null
  const institutionId = data.institutionId ?? null
  const roles = normalizeRoles(data.roles)
  const primaryRole: Role = roles[0] ?? 'UNKNOWN'

  const user: AuthUser = {
    id,
    username: data.username,
    email: data.email,
    institutionId,
    institutionName: data.institutionName,
    roles,
    appRole: primaryRole
  }

  return { user, token }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (storedToken) {
      setToken(storedToken)
      api.defaults.headers.common.Authorization = `Bearer ${storedToken}`
    }
  }, [])

  const login = async (usernameOrEmail: string, password: string) => {
    setLoading(true)
    try {
      const { data } = await api.post<LoginResponseDto>('/auth/login', {
        usernameOrEmail,
        password
      })
      const { user: builtUser, token: newToken } = buildAuthUser(data)
      localStorage.setItem(TOKEN_KEY, newToken)
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`
      setUser(builtUser)
      setToken(newToken)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    delete api.defaults.headers.common.Authorization
    setUser(null)
    setToken(null)
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
