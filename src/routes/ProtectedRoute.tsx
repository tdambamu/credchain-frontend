import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { Role } from '../types/auth'
import { useAuth } from '../context/AuthContext'

type Props = {
  children: ReactNode
  roles?: Role[]
}

const ProtectedRoute = ({ children, roles }: Props) => {
  const { user, token, loading } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        Loading...
      </div>
    )
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.appRole)) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
