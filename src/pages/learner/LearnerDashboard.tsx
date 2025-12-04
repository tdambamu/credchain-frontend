import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getCurrentLearner } from '../../api/learners'
import { getCredentialsByLearner } from '../../api/credentials'
import type { Learner } from '../../types/learner'
import type { Credential } from '../../types/credential'

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString()
}

const getDisplayStatus = (cred: Credential): string => {
  const status = (cred.status || '').toUpperCase()
  if (status === 'ISSUED') return 'Active'
  if (status === 'REVOKED') return 'Revoked'
  if (status === 'EXPIRED') return 'Expired'
  if (status === 'PENDING') return 'Pending'
  return status || '-'
}

const LearnerDashboard: React.FC = () => {
  const { user } = useAuth()
  const [learner, setLearner] = useState<Learner | null>(null)
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const profile = await getCurrentLearner()
        setLearner(profile)
        const creds = await getCredentialsByLearner(profile.id)
        setCredentials(creds)
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Failed to load your learner profile or credentials.'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <DashboardLayout title="My credentials">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-100">
            Welcome, {learner ? `${learner.firstName} ${learner.lastName}` : user?.username}
          </div>
          <div className="text-xs text-slate-400">
            This page shows credentials that have been issued to your learner
            profile at your institution.
          </div>
        </div>
        <div className="text-xs text-slate-500">
          Institution:{' '}
          <span className="font-semibold text-slate-100">
            {learner?.institutionName || user?.institutionName || 'N/A'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-200">
          Loading your credentials…
        </div>
      )}

      {!loading && !error && !learner && (
        <div className="rounded-md border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-xs text-amber-100">
          We could not find a learner profile linked to your account. Please
          contact your institution so they can create a learner record with your
          email.
        </div>
      )}

      {!loading && learner && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Learner profile
            </div>
            <div className="mt-2 text-sm text-slate-100">
              {learner.firstName} {learner.lastName}
            </div>
            <div className="mt-1 text-xs text-slate-400">{learner.email}</div>
            <div className="mt-1 grid gap-2 text-xs text-slate-400 md:grid-cols-3">
              <div>
                <span className="text-slate-500">Student number: </span>
                <span>{learner.studentNumber || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">National ID: </span>
                <span>{learner.nationalId || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">Date of birth: </span>
                <span>{learner.dateOfBirth || '-'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div className="text-sm font-semibold text-slate-100">
                Credentials ({credentials.length})
              </div>
            </div>

            {credentials.length === 0 ? (
              <div className="px-4 py-4 text-xs text-slate-400">
                No credentials have been issued to you yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {credentials.map(cred => (
                  <div key={cred.id} className="px-4 py-3 text-xs">
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-100">
                          {cred.title}
                        </div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">
                          {cred.credentialType}
                        </div>
                        {cred.description && (
                          <div className="mt-1 text-[11px] text-slate-400">
                            {cred.description}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-start gap-1 text-[11px] text-slate-400 md:items-end">
                        <div>
                          Issued:{' '}
                          <span className="text-slate-200">
                            {formatDate(cred.issuedAt || null)}
                          </span>
                        </div>
                        <div>
                          Expires:{' '}
                          <span className="text-slate-200">
                            {cred.expiresAt
                              ? formatDate(cred.expiresAt)
                              : 'No expiry'}
                          </span>
                        </div>
                        <div>
                          Status:{' '}
                          <span className="font-semibold text-slate-100">
                            {getDisplayStatus(cred)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default LearnerDashboard
