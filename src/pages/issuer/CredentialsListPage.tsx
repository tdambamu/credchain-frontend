import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getLearnersForInstitution } from '../../api/learners'
import {
  getCredentialsByLearner,
  revokeCredential
} from '../../api/credentials'
import type { Learner } from '../../types/learner'
import type { Credential } from '../../types/credential'

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString()
}

const CredentialsListPage: React.FC = () => {
  const { user } = useAuth()
  const [learners, setLearners] = useState<Learner[]>([])
  const [selectedLearnerId, setSelectedLearnerId] = useState('')
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loadingLearners, setLoadingLearners] = useState(false)
  const [loadingCreds, setLoadingCreds] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    const loadLearners = async () => {
      if (!user?.institutionId) {
        setError('Your account is not linked to an institution.')
        return
      }
      setLoadingLearners(true)
      setError('')
      try {
        const res = await getLearnersForInstitution(user.institutionId, 100)
        setLearners(res)
        if (!res.length) {
          setInfo(
            'No learners found for this institution yet. Issue credentials once learners are onboarded.'
          )
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Failed to load learners.'
        setError(msg)
      } finally {
        setLoadingLearners(false)
      }
    }

    loadLearners()
  }, [user?.institutionId])

  const loadCredentials = async (learnerId: number) => {
    setLoadingCreds(true)
    setError('')
    setInfo('')
    try {
      const data = await getCredentialsByLearner(learnerId)
      setCredentials(data)
      if (!data.length) {
        setInfo('No credentials issued yet for this learner.')
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to load credentials for this learner.'
      setError(msg)
    } finally {
      setLoadingCreds(false)
    }
  }

  const handleLearnerChange = (value: string) => {
    setSelectedLearnerId(value)
    setCredentials([])
    setInfo('')
    setError('')
    if (value && /^\d+$/.test(value)) {
      loadCredentials(Number(value))
    }
  }

  const handleRevoke = async (cred: Credential) => {
    const isRevoked = Boolean(cred.revokedAt)
    if (isRevoked) return
    const confirmed = window.confirm(
      `Revoke credential "${cred.title}" for ${cred.learnerName}?`
    )
    if (!confirmed) return

    setError('')
    setInfo('')
    try {
      const updated = await revokeCredential(cred.publicId)
      setCredentials(prev =>
        prev.map(c => (c.id === updated.id ? updated : c))
      )
      setInfo(`Credential "${updated.title}" has been revoked.`)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to revoke credential.'
      setError(msg)
    }
  }

  const handleCopyLink = (cred: Credential) => {
    const url = `${window.location.origin}/verify/${cred.publicId}`
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setInfo(`Verification link copied to clipboard: ${url}`)
      })
      .catch(() => {
        setError('Failed to copy verification link to clipboard.')
      })
  }

  const learnersOptions = learners

  return (
    <DashboardLayout title="Issued credentials">
      <div className="space-y-5">
        <div className="text-xs text-slate-400">
          View and manage credentials that have been issued by your institution.
          Select a learner to see all credentials recorded for them.
        </div>

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

        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <label className="text-slate-200">Learner</label>
              <select
                value={selectedLearnerId}
                onChange={e => handleLearnerChange(e.target.value)}
                disabled={loadingLearners || !learnersOptions.length}
                className="w-full md:w-80 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 disabled:opacity-60"
              >
                <option value="">
                  {loadingLearners
                    ? 'Loading learners...'
                    : learnersOptions.length
                    ? 'Select learner'
                    : 'No learners found'}
                </option>
                {learnersOptions.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.firstName} {l.lastName} ({l.studentNumber || l.email})
                  </option>
                ))}
              </select>
            </div>

            {loadingCreds && (
              <div className="text-[11px] text-slate-500">Loading credentials…</div>
            )}
          </div>

          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="min-w-full text-xs text-left text-slate-200">
              <thead className="border-b border-slate-800 bg-slate-900/90 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Issued</th>
                  <th className="px-3 py-2">Expires</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map(cred => {
                  const isRevoked = Boolean(cred.revokedAt)
                  return (
                    <tr
                      key={cred.id}
                      className="border-t border-slate-800/80 hover:bg-slate-900"
                    >
                      <td className="px-3 py-2 text-xs text-slate-50">
                        {cred.title}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-300">
                        {cred.credentialType}
                      </td>
                      <td className="px-3 py-2 text-[11px]">
                        <span
                          className={
                            isRevoked
                              ? 'rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] text-red-300 border border-red-500/40'
                              : 'rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300 border border-emerald-500/40'
                          }
                        >
                          {isRevoked ? 'Revoked' : cred.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-300">
                        {formatDate(cred.issuedAt)}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-300">
                        {formatDate(cred.expiresAt)}
                      </td>
                      <td className="px-3 py-2 text-[11px]">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(cred)}
                            className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-200 hover:border-indigo-400 hover:text-indigo-300"
                          >
                            Copy link
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevoke(cred)}
                            disabled={isRevoked}
                            className="rounded-full border border-red-500/60 bg-red-950/40 px-2 py-0.5 text-[10px] text-red-200 hover:bg-red-900/60 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {!credentials.length && !loadingCreds && selectedLearnerId && !error && (
                  <tr>
                    <td
                      className="px-3 py-4 text-center text-[11px] text-slate-500"
                      colSpan={6}
                    >
                      No credentials issued yet for this learner.
                    </td>
                  </tr>
                )}

                {!credentials.length &&
                  !loadingCreds &&
                  !selectedLearnerId &&
                  !error && (
                    <tr>
                      <td
                        className="px-3 py-4 text-center text-[11px] text-slate-500"
                        colSpan={6}
                      >
                        Select a learner to view their credentials.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CredentialsListPage
