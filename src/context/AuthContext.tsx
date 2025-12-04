import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'
import { fetchProfile } from '../api/auth'
import type { Role, AuthUser } from '../types/auth'

// This type mirrors the backend LoginResponse DTO
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
  // Initialize loading to true so we don't render protected routes until session is checked
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      if (storedToken) {
        // Optimistically set token header so the request works
        setToken(storedToken)
        api.defaults.headers.common.Authorization = `Bearer ${storedToken}`
        try {
          // Fetch the full profile to get the latest Institution ID and Roles
          // We treat the response as LoginResponseDto (ignoring the token field which might be null in /me response)
          const data = await fetchProfile()
          // Pass the data (casted to any/dto to satisfy TS) to our builder
          // The /me endpoint returns a similar structure to login but without the token usually,
          // however buildAuthUser handles extracting the user part.
          const { user: builtUser } = buildAuthUser({ ...data, token: storedToken } as LoginResponseDto)
          setUser(builtUser)
        } catch (error) {
          console.error('Failed to restore session:', error)
          // If profile fetch fails (e.g. 401), clear everything
          localStorage.removeItem(TOKEN_KEY)
          delete api.defaults.headers.common.Authorization
          setToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }

    initAuth()
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