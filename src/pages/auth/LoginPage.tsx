import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { Role } from '../../types/auth'

const getDashboardRouteForRole = (role: Role) => {
  switch (role) {
    case 'ADMIN':
      return '/admin'
    case 'ISSUER':
      return '/issuer'
    case 'LEARNER':
      return '/learner'
    default:
      return '/verify'
  }
}

const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validate = () => {
    const u = usernameOrEmail.trim()
    const p = password.trim()
    if (!u) return 'Please enter your username or email.'
    if (u.length > 100) return 'Username or email must not be longer than 100 characters.'
    if (!p) return 'Please enter your password.'
    if (p.length < 6 || p.length > 100) return 'Password must be between 6 and 100 characters.'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setLoading(true)
    try {
      const user = await login({ usernameOrEmail: usernameOrEmail.trim(), password: password.trim() })
      const route = getDashboardRouteForRole(user.appRole)
      navigate(route, { replace: true })
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Login failed. Please check your credentials.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#ffffff',
          padding: 24,
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, textAlign: 'center' }}>
          CredChain Login
        </h1>
        {error && (
          <div style={{ marginBottom: 12, fontSize: 14, color: '#b91c1c' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>Username or Email</label>
            <input
              type="text"
              value={usernameOrEmail}
              onChange={e => setUsernameOrEmail(e.target.value)}
              required
              maxLength={101}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 14,
                borderRadius: 4,
                border: '1px solid #d1d5db'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 14,
                borderRadius: 4,
                border: '1px solid #d1d5db'
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 0',
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 4,
              border: 'none',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1,
              background: '#2563eb',
              color: '#ffffff'
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
