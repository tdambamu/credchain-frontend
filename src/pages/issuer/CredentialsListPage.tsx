import React, { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { getLearners } from '../../api/learners'
import { getCredentialsByLearner, revokeCredential } from '../../api/credentials'
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
  if (cred.status === 'PENDING') return 'PENDING'
  const now = new Date()
  if (cred.expiresAt) {
    const exp = new Date(cred.expiresAt)
    if (!Number.isNaN(exp.getTime()) && exp.getTime() < now.getTime()) {
      return 'EXPIRED'
    }
  }
  if (cred.status === 'ISSUED') return 'ISSUED'
  if (cred.status) return cred.status
  return 'ACTIVE'
}

const statusBadgeClass = (status: string) => {
  const display = status.toUpperCase()
  if (display === 'REVOKED') {
    return 'bg-red-500/15 text-red-300 border border-red-500/40'
  }
  if (display === 'EXPIRED') {
    return 'bg-amber-500/15 text-amber-200 border border-amber-500/40'
  }
  if (display === 'PENDING') {
    return 'bg-sky-500/15 text-sky-200 border border-sky-500/40'
  }
  if (display === 'ISSUED' || display === 'ACTIVE') {
    return 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/40'
  }
  return 'bg-slate-500/15 text-slate-200 border border-slate-500/40'
}

const CredentialsListPage: React.FC = () => {
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
      setLoadingLearners(true)
      setError('')
      setInfo('')
      try {
        const page = await getLearners({ page: 0, size: 100 })
        const list = Array.isArray(page.content) ? page.content : []
        setLearners(list)
        if (!list.length) {
          setInfo(
            'No learners found for your account yet. Please create learners for this institution first.'
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
  }, [])

  const loadCredentials = async (learnerId: number) => {
    setLoadingCreds(true)
    setError('')
    setInfo('')
    setCredentials([])
    try {
      const data = await getCredentialsByLearner(learnerId)
      setCredentials(data)
      if (!data.length) {
        setInfo('No credentials found for this learner yet.')
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
    if (cred.revokedAt) return
    setError('')
    setInfo('')
    setConfirmCred(cred)
  }

  const closeRevokeDialog = () => {
    setConfirmCred(null)
    setRevokingId(null)
  }

  const confirmRevoke = async () => {
    if (!confirmCred) return
    try {
      setRevokingId(confirmCred.publicId)
      const updated = await revokeCredential(confirmCred.publicId)
      setCredentials(prev =>
        prev.map(c => (c.publicId === updated.publicId ? updated : c))
      )
      setInfo('Credential revoked successfully.')
      setConfirmCred(null)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to revoke credential.'
      setError(msg)
    } finally {
      setRevokingId(null)
    }
  }

  const learnersOptions = useMemo(() => learners, [learners])

  const hasFilters = statusFilter !== 'ALL' || search.trim().length > 0

  const filteredCredentials = useMemo(() => {
    return credentials.filter(cred => {
      const displayStatus = getDisplayStatus(cred)
      if (statusFilter !== 'ALL' && displayStatus !== statusFilter) {
        return false
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
  }, [credentials, statusFilter, search])

  return (
    <DashboardLayout title="Issued Credentials">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-white">Issued credentials</h1>
          <p className="text-sm text-slate-400">
            Select a learner from your institution to view all credentials issued to them. You can
            search, filter by status, and revoke credentials when necessary.
          </p>
        </div>

        {error && (
          <div className="rounded border border-red-500 bg-red-950/40 px-3 py-2 text-xs text-red-100">
            {error}
          </div>
        )}

        {info && !error && (
          <div className="rounded border border-blue-500 bg-slate-900 px-3 py-2 text-xs text-blue-100">
            {info}
          </div>
        )}

        <div className="flex flex-col gap-4 rounded-xl bg-slate-900 p-4 shadow md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-300">
                Learner
              </label>
              <select
                value={selectedLearnerId}
                onChange={e => handleLearnerChange(e.target.value)}
                disabled={loadingLearners || !learnersOptions.length}
                className="w-full md:w-80 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-60"
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
                  className="w-full sm:w-56 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-60"
                  disabled={!selectedLearnerId || loadingCreds}
                />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  disabled={!selectedLearnerId || loadingCreds}
                  className="w-full sm:w-40 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-60"
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
                  className="self-start rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {loadingCreds && selectedLearnerId && (
            <div className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300">
              Loading credentials…
            </div>
          )}

          {!loadingCreds &&
            selectedLearnerId &&
            !filteredCredentials.length &&
            !error && (
              <div className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300">
                No credentials match the current filters.
              </div>
            )}

          {!selectedLearnerId && !loadingLearners && learnersOptions.length > 0 && (
            <div className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300">
              Select a learner above to view their credentials.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {filteredCredentials.map(cred => {
              const displayStatus = getDisplayStatus(cred)
              return (
                <div
                  key={cred.publicId}
                  className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-100 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-white">
                          {cred.title}
                        </h2>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(
                            displayStatus
                          )}`}
                        >
                          {displayStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {cred.credentialType} • #{cred.publicId}
                      </p>
                      <p className="text-xs text-slate-400">
                        Learner: {cred.learnerName} • Institution: {cred.institutionName}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-300">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">
                        Issued
                      </p>
                      <p>{formatDate(cred.issuedAt || null)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">
                        Expires
                      </p>
                      <p>{formatDate(cred.expiresAt || null)}</p>
                    </div>
                    {cred.revokedAt && (
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">
                          Revoked
                        </p>
                        <p>{formatDate(cred.revokedAt)}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">
                        Issuer
                      </p>
                      <p>{cred.issuerUsername}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-3">
                    <a
                      href={`/verify/${cred.publicId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-indigo-300 hover:underline"
                    >
                      Open verification page
                    </a>

                    {!cred.revokedAt && (
                      <button
                        type="button"
                        onClick={() => openRevokeDialog(cred)}
                        className="rounded-full border border-red-500 px-3 py-1 text-xs font-medium text-red-200 hover:bg-red-900/40"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {confirmCred && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-950 p-5 shadow-xl">
              <h2 className="text-base font-semibold text-white">Revoke credential</h2>
              <p className="mt-2 text-xs text-slate-300">
                You are about to revoke the credential{' '}
                <span className="font-semibold text-slate-100">
                  {confirmCred.title}
                </span>{' '}
                for{' '}
                <span className="font-semibold text-slate-100">
                  {confirmCred.learnerName}
                </span>
                . This action cannot be undone. Are you sure you want to continue?
              </p>

              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeRevokeDialog}
                  disabled={revokingId === confirmCred.publicId}
                  className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRevoke}
                  disabled={revokingId === confirmCred.publicId}
                  className="rounded-lg border border-red-600 bg-red-700 px-3 py-1.5 text-xs font-medium text-slate-50 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {revokingId === confirmCred.publicId ? 'Revoking…' : 'Confirm revoke'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default CredentialsListPage
