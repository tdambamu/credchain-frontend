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

const getDisplayStatus = (cred: Credential): string => {
  if (cred.revokedAt) return 'REVOKED'
  const raw = cred.status || ''
  const upper = raw.toUpperCase()
  if (upper === 'EXPIRED') return 'EXPIRED'
  if (upper === 'PENDING') return 'PENDING'
  if (upper === 'ISSUED') return 'ISSUED'
  if (!raw) return 'ACTIVE'
  return upper
}

const getStatusClasses = (displayStatus: string) => {
  if (displayStatus === 'REVOKED') {
    return 'bg-red-500/15 text-red-300 border border-red-500/40'
  }
  if (displayStatus === 'EXPIRED') {
    return 'bg-amber-500/15 text-amber-200 border border-amber-500/40'
  }
  if (displayStatus === 'PENDING') {
    return 'bg-sky-500/15 text-sky-200 border border-sky-500/40'
  }
  if (displayStatus === 'ISSUED' || displayStatus === 'ACTIVE') {
    return 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/40'
  }
  return 'bg-slate-500/15 text-slate-200 border border-slate-500/40'
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

  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  const [confirmCred, setConfirmCred] = useState<Credential | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  useEffect(() => {
    const loadLearners = async () => {
      if (!user?.institutionId) {
        setError('Your account is not linked to an institution.')
        return
      }
      setLoadingLearners(true)
      setError('')
      setInfo('')
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
    setCredentials([])
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
    setStatusFilter('ALL')
    setSearch('')
    setError('')
    setInfo('')
    if (value) {
      const id = Number(value)
      if (!Number.isNaN(id)) {
        loadCredentials(id)
      }
    }
  }

  const openRevokeDialog = (cred: Credential) => {
    const isRevoked = Boolean(cred.revokedAt)
    if (isRevoked) return
    setError('')
    setInfo('')
    setConfirmCred(cred)
  }

  const confirmRevoke = async () => {
    if (!confirmCred) return
    const cred = confirmCred
    const isRevoked = Boolean(cred.revokedAt)
    if (isRevoked) {
      setConfirmCred(null)
      return
    }

    setRevokingId(cred.publicId)
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
    } finally {
      setRevokingId(null)
      setConfirmCred(null)
    }
  }

  const handleCopyLink = (cred: Credential) => {
    const url = `${window.location.origin}/verify/${cred.publicId}`
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setError('')
        setInfo(`Verification link copied to clipboard: ${url}`)
      })
      .catch(() => {
        setError('Failed to copy verification link to clipboard.')
      })
  }

  const learnersOptions = learners

  const filteredCredentials = credentials.filter(cred => {
    const displayStatus = getDisplayStatus(cred)
    if (statusFilter !== 'ALL') {
      if (displayStatus !== statusFilter) {
        return false
      }
    }
    const q = search.trim().toLowerCase()
    if (!q) return true
    const haystack = [
      cred.title,
      cred.credentialType,
      cred.publicId,
      cred.learnerName
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })

  const hasFilters = statusFilter !== 'ALL' || search.trim() !== ''

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
                className="w-full md:w-80 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-60"
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
                    {l.firstName} {l.lastName} ({l.studentNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 md:items-end">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search title, type, ID"
                  className="w-full sm:w-56 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-60"
                  disabled={!selectedLearnerId || loadingCreds}
                />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  disabled={!selectedLearnerId || loadingCreds}
                  className="w-full sm:w-40 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-60"
                >
                  <option value="ALL">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ISSUED">Issued</option>
                  <option value="PENDING">Pending</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="REVOKED">Revoked</option>
                </select>
              </div>
              {hasFilters && selectedLearnerId && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ALL')
                    setSearch('')
                  }}
                  className="self-start text-[11px] text-slate-400 hover:text-slate-200"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            {selectedLearnerId
              ? credentials.length
                ? `${filteredCredentials.length} of ${credentials.length} credentials shown.`
                : loadingCreds
                ? 'Loading credentials…'
                : 'No credentials have been issued for this learner yet.'
              : 'Select a learner to view credentials.'}
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
                {loadingCreds && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-4 text-center text-[11px] text-slate-500"
                    >
                      Loading credentials…
                    </td>
                  </tr>
                )}

                {!loadingCreds &&
                  selectedLearnerId &&
                  credentials.length > 0 &&
                  filteredCredentials.map(cred => {
                    const displayStatus = getDisplayStatus(cred)
                    const statusClasses = getStatusClasses(displayStatus)
                    const isRevoked = Boolean(cred.revokedAt)
                    const isBusy = revokingId === cred.publicId

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
                              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ' +
                              statusClasses
                            }
                          >
                            {displayStatus}
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
                              className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[11px] text-slate-200 hover:border-indigo-400 hover:text-indigo-300"
                            >
                              Copy link
                            </button>
                            <button
                              type="button"
                              onClick={() => openRevokeDialog(cred)}
                              disabled={isRevoked || isBusy}
                              className="rounded-full border border-red-700/70 bg-red-900/40 px-2 py-0.5 text-[11px] text-red-200 hover:border-red-400 hover:bg-red-900/60 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isRevoked ? 'Revoked' : isBusy ? 'Revoking…' : 'Revoke'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}

                {!loadingCreds &&
                  selectedLearnerId &&
                  credentials.length > 0 &&
                  filteredCredentials.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-4 text-center text-[11px] text-slate-500"
                      >
                        No credentials match the current filters.
                      </td>
                    </tr>
                  )}

                {!loadingCreds &&
                  !selectedLearnerId && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-4 text-center text-[11px] text-slate-500"
                      >
                        Select a learner to view their credentials.
                      </td>
                    </tr>
                  )}

                {!loadingCreds &&
                  selectedLearnerId &&
                  credentials.length === 0 &&
                  !error && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-4 text-center text-[11px] text-slate-500"
                      >
                        No credentials issued yet for this learner.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {confirmCred && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950/95 p-5 text-sm text-slate-100">
            <div className="space-y-2">
              <div className="text-base font-semibold text-slate-50">
                Revoke credential?
              </div>
              <div className="text-xs text-slate-300">
                You are about to revoke the credential{' '}
                <span className="font-semibold text-slate-50">
                  {confirmCred.title}
                </span>{' '}
                issued to{' '}
                <span className="font-semibold text-slate-50">
                  {confirmCred.learnerName}
                </span>
                . After revocation, verification checks will show this credential as
                no longer valid.
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setConfirmCred(null)}
                className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-slate-200 hover:border-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRevoke}
                disabled={revokingId === confirmCred.publicId}
                className="rounded-lg border border-red-600 bg-red-700 px-3 py-1.5 text-slate-50 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {revokingId === confirmCred.publicId ? 'Revoking…' : 'Confirm revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default CredentialsListPage
