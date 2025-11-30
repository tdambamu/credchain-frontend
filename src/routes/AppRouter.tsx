import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '../pages/auth/LoginPage'
import IssuerDashboard from '../pages/issuer/IssuerDashboard'
import AdminDashboard from '../pages/admin/AdminDashboard'
import LearnerDashboard from '../pages/learner/LearnerDashboard'
import VerifyCredentialPage from '../pages/public/VerifyCredentialPage'
import ProtectedRoute from './ProtectedRoute'
import type { Role } from '../types/auth'
import CredentialsListPage from '../pages/issuer/CredentialsListPage'
import IssueCredentialPage from '../pages/issuer/IssueCredentialPage'
import InstitutionsPage from '../pages/admin/InstitutionsPage'
import UsersPage from '../pages/admin/UsersPage'
import { useAuth } from '../context/AuthContext'

const AppRouter = () => {
  const issuerRoles: Role[] = ['ISSUER']
  const adminRoles: Role[] = ['SYSTEM_ADMIN', 'INSTITUTION_ADMIN']
  const systemAdminRoles: Role[] = ['SYSTEM_ADMIN']
  const learnerRoles: Role[] = ['LEARNER']
  const { user, token } = useAuth()

  const getHomeForUser = () => {
    if (!token || !user) return '/login'

    switch (user.appRole) {
      case 'SYSTEM_ADMIN':
      case 'INSTITUTION_ADMIN':
        return '/admin'
      case 'ISSUER':
        return '/issuer'
      case 'LEARNER':
        return '/learner'
      case 'EMPLOYER':
        return '/verify'
      default:
        return '/verify'
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/issuer"
        element={
          <ProtectedRoute roles={issuerRoles}>
            <IssuerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/issuer/credentials"
        element={
          <ProtectedRoute roles={issuerRoles}>
            <CredentialsListPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/issuer/issue"
        element={
          <ProtectedRoute roles={issuerRoles}>
            <IssueCredentialPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={adminRoles}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/institutions"
        element={
          <ProtectedRoute roles={systemAdminRoles}>
            <InstitutionsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={adminRoles}>
            <UsersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/learner"
        element={
          <ProtectedRoute roles={learnerRoles}>
            <LearnerDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/verify" element={<VerifyCredentialPage />} />
      <Route path="/verify/:credentialId" element={<VerifyCredentialPage />} />

      <Route path="/" element={<Navigate to={getHomeForUser()} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRouter
