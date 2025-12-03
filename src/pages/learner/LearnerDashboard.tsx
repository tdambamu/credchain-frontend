import React, { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getLearners } from '../../api/learners'
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
  if (cred.revokedAt) return 'REVOKED'
  const raw = cred.status || ''
  const upper = raw.toUpperCase()
  if (upper === 'EXPIRED') return 'EXPIRED'
  if (upper === 'ISSUED') return 'ISSUED'
  if (!raw) return 'ACTIVE'
  return upper
}

const isValidCredential = (cred: Credential): boolean => {
  const status = getDisplayStatus(cred)
  if (status === 'REVOKED' || status === 'EXPIRED') return false
  return true
}

const LearnerDashboard: React.FC = () => {
  const { user } = useAuth()
  const [learner, setLearner] = useState<Learner | null>(null)
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!user) return

      if (!user.institutionId) {
        setError('Your account is not linked to an institution.')
        return
      }

      setLoading(true)
      setError('')
      setInfo('')
      setLearner(null)
      setCredentials([])

      try {
        const page = await getLearners({
          institutionId: user.institutionId,
          page: 0,
          size: 200
        })

        const match = page.content.find(l =>
          l.email.toLowerCase() === user.email.toLowerCase()
        )

        if (!match) {
          setInfo(
            'We could not find a learner profile linked to your account yet. Once your institution registers you as a learner, your credentials will appear here.'
          )
          return
        }

        setLearner(match)

        const learnerCredentials = await getCredentialsByLearner(match.id)
        setCredentials(learnerCredentials)

        if (!learnerCredentials.length) {
          setInfo('No credentials have been issued to you yet.')
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Failed to load your learner profile.'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.id, user?.email, user?.institutionId])

  const stats = useMemo(() => {
    const total = credentials.length
    const valid = credentials.filter(isValidCredential).length
    const revokedExpired = total - valid
    return { total, valid, revokedExpired }
  }, [credentials])

  return (
    <DashboardLayout title="My credentials">
      <div className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-500/60 bg-red-950/40 px-3 py-2 text-xs text-red-100">
            {error}
          </div>
        )}

        {info && !error && (
          <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
            {info}
          </div>
        )}

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-300">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">
                Learner profile
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-50">
                {learner
                  ? `${learner.firstName} ${learner.lastName}`
                  : user?.email}
              </div>
              <div className="text-[11px] text-slate-400">
                {learner?.studentNumber
                  ? `Student number: ${learner.studentNumber}`
                  : 'Your institution can link your learner record to this account so that credentials show automatically.'}
              </div>
            </div>
            {learner?.institutionName && (
              <div className="text-right text-[11px] text-slate-400">
                <div className="uppercase tracking-wide">Institution</div>
                <div className="mt-1 text-xs text-slate-200">
                  {learner.institutionName}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-4 flex flex-col justify-between">
            <div className="text-[11px] text-slate-400 uppercase">
              Total credentials
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-50">
              {stats.total}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-800/70 bg-emerald-950/40 px-4 py-4 flex flex-col justify-between">
            <div className="text-[11px] text-emerald-200 uppercase">
              Valid / active
            </div>
            <div className="mt-3 text-3xl font-semibold text-emerald-100">
              {stats.valid}
            </div>
          </div>
          <div className="rounded-xl border border-amber-800/70 bg-amber-950/30 px-4 py-4 flex flex-col justify-between">
            <div className="text-[11px] text-amber-200 uppercase">
              Revoked / expired
            </div>
            <div className="mt-3 text-3xl font-semibold text-amber-100">
              {stats.revokedExpired}
            </div>
          </div>
        </div>

        {loading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-300">
            Loading your credentials…
          </div>
        )}

        {!loading && learner && credentials.length === 0 && !error && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-300">
            No credentials have been issued to you yet.
          </div>
        )}

        {!loading && learner && credentials.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {credentials.map(cred => {
              const status = getDisplayStatus(cred)
              const isValid = isValidCredential(cred)
              return (
                <div
                  key={cred.id}
                  className="flex h-full flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-xs text-slate-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] uppercase text-slate-400">
                        {cred.institutionName}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-50">
                        {cred.title}
                      </div>
                      {cred.credentialType && (
                        <div className="text-[11px] text-slate-400">
                          {cred.credentialType}
                        </div>
                      )}
                    </div>
                    <span
                      className={
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ' +
                        (status === 'REVOKED'
                          ? 'bg-red-500/15 text-red-200 border border-red-500/40'
                          : status === 'EXPIRED'
                          ? 'bg-amber-500/15 text-amber-200 border border-amber-500/40'
                          : 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/40')
                      }
                    >
                      {status}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 border-t border-slate-800 pt-3 text-[11px] text-slate-300">
                    <div className="flex justify-between">
                      <span>Issued</span>
                      <span>{formatDate(cred.issuedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expires</span>
                      <span>{formatDate(cred.expiresAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Credential ID</span>
                      <span className="font-mono text-[10px]">
                        {cred.publicId}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <span
                        className={
                          'rounded-md px-2 py-0.5 text-[10px] font-medium ' +
                          (isValid
                            ? 'bg-emerald-500/15 text-emerald-100 border border-emerald-500/40'
                            : 'bg-slate-600/30 text-slate-100 border border-slate-600/60')
                        }
                      >
                        {isValid ? 'Verified on-chain' : 'No longer valid'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default LearnerDashboard
