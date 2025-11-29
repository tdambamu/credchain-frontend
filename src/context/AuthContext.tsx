import React, { createContext, useContext, useEffect, useState } from 'react'
import type { AuthUser, BackendLoginResponse, LoginPayload, Role } from '../types/auth'
import { clearStoredToken, getStoredToken, setStoredToken } from '../utils/storage'
import { fetchProfile, loginRequest } from '../api/auth'

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (payload: LoginPayload) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const mapRolesToAppRole = (roles: string[]): Role => {
  const upper = roles.map(r => r.toUpperCase())
  if (upper.some(r => r.includes('ADMIN'))) return 'ADMIN'
  if (upper.some(r => r.includes('ISSUER'))) return 'ISSUER'
  if (upper.some(r => r.includes('LEARNER'))) return 'LEARNER'
  if (upper.some(r => r.includes('VERIFIER'))) return 'VERIFIER'
  return 'UNKNOWN'
}

const mapLoginResponseToAuthUser = (resp: BackendLoginResponse): AuthUser => {
  return {
    id: resp.id,
    username: resp.username,
    email: resp.email,
    institutionId: resp.institutionId,
    institutionName: resp.institutionName,
    roles: resp.roles,
    appRole: mapRolesToAppRole(resp.roles || [])
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = getStoredToken()
    if (!stored) {
      setLoading(false)
      return
    }
    setToken(stored)
    fetchProfile()
      .then(profile => {
        const authUser = mapLoginResponseToAuthUser(profile)
        setUser(authUser)
      })
      .catch(() => {
        clearStoredToken()
        setToken(null)
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const login = async (payload: LoginPayload): Promise<AuthUser> => {
    setLoading(true)
    try {
      const data = await loginRequest(payload)
      setStoredToken(data.token)
      setToken(data.token)
      const authUser = mapLoginResponseToAuthUser(data)
      setUser(authUser)
      return authUser
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    clearStoredToken()
    setToken(null)
    setUser(null)
    window.location.href = '/login'
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

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

export const useHasRole = (roles: Role[]) => {
  const { user } = useAuth()
  if (!user) return false
  return roles.includes(user.appRole)
}
