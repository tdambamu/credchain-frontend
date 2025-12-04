import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { verifyCredential } from '../../api/verification'
import type { CredentialVerification } from '../../types/credential'

type HistoryItem = {
  publicId: string
  timestamp: string
  valid: boolean
  status: string
  title?: string | null
  learnerFullName?: string | null
}

const HISTORY_KEY = 'credchain_verification_history_v1'

const EmployerDashboard: React.FC = () => {
  const [publicId, setPublicId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CredentialVerification | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setHistory(parsed)
        }
      }
    } catch {
    }
  }, [])

  const saveHistory = (items: HistoryItem[]) => {
    setHistory(items)
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
    } catch {
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = publicId.trim()
    if (!id) {
      setError('Please enter a credential verification ID.')
      setResult(null)
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await verifyCredential(id)
      setResult(data)

      const item: HistoryItem = {
        publicId: id,
        timestamp: new Date().toISOString(),
        valid: data.valid,
        status: data.status,
        title: data.title,
        learnerFullName: data.learnerFullName
      }

      const next = [item, ...history].slice(0, 10)
      saveHistory(next)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Verification failed. Please check the ID and try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (value?: string | null) => {
    if (!value) return '-'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleString()
  }

  const getStatusBadgeClass = (status?: string | null, valid?: boolean) => {
    if (!status && valid === undefined) return 'bg-slate-800 text-slate-100'
    const s = (status || '').toUpperCase()
    if (s === 'REVOKED') return 'bg-red-500/20 text-red-200'
    if (s === 'EXPIRED') return 'bg-amber-500/20 text-amber-200'
    if (s === 'PENDING') return 'bg-sky-500/20 text-sky-200'
    if (valid) return 'bg-emerald-500/20 text-emerald-200'
    return 'bg-red-500/20 text-red-200'
  }

  return (
    <DashboardLayout title="Verify credentials">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-xl font-semibold text-white">
              Credential verification
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Enter the verification ID provided by the candidate to check if
              the credential is valid and was issued by the institution.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4"
          >
            <label className="flex flex-col gap-1 text-sm text-slate-100">
              Verification ID
              <input
                type="text"
                value={publicId}
                onChange={e => setPublicId(e.target.value)}
                placeholder="Paste or type credential verification ID"
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </label>

            <button
              type="submit"
              disabled={loading || !publicId.trim()}
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Verifying…' : 'Verify credential'}
            </button>

            {error && (
              <div className="rounded-md border border-red-500/40 bg-red-950/50 px-3 py-2 text-xs text-red-100">
                {error}
              </div>
            )}
          </form>

          {result && (
            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">
                    Result
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-50">
                    {result.title || 'Verified credential'}
                  </div>
                  {result.learnerFullName && (
                    <div className="mt-1 text-sm text-slate-300">
                      {result.learnerFullName}
                    </div>
                  )}
                </div>
                <span
                  className={
                    'rounded-full px-3 py-1 text-xs font-semibold ' +
                    getStatusBadgeClass(result.status, result.valid)
                  }
                >
                  {result.valid ? 'VALID' : result.status || 'INVALID'}
                </span>
              </div>

              <div className="grid gap-2 text-xs text-slate-300 md:grid-cols-2">
                <div>
                  <span className="text-slate-500">Institution: </span>
                  <span>{result.institutionName || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Type: </span>
                  <span>{result.credentialType || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Issued: </span>
                  <span>{formatDate(result.issuedAt)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Expires: </span>
                  <span>
                    {result.expiresAt ? formatDate(result.expiresAt) : 'No expiry'}
                  </span>
                </div>
                {result.revokedAt && (
                  <div>
                    <span className="text-slate-500">Revoked: </span>
                    <span>{formatDate(result.revokedAt)}</span>
                  </div>
                )}
              </div>

              <p className="mt-2 text-xs text-slate-400">{result.message}</p>
            </div>
          )}
        </div>

        <div className="w-full max-w-sm space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Recent checks
            </div>
            {history.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                No verification history yet. Your last few checks will appear here.
              </p>
            ) : (
              <ul className="mt-2 space-y-2 text-xs text-slate-300">
                {history.map(item => (
                  <li
                    key={`${item.publicId}-${item.timestamp}`}
                    className="flex flex-col rounded-md border border-slate-800 bg-slate-950 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] text-slate-400">
                        {item.publicId}
                      </span>
                      <span
                        className={
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold ' +
                          getStatusBadgeClass(item.status, item.valid)
                        }
                      >
                        {item.valid ? 'VALID' : item.status || 'INVALID'}
                      </span>
                    </div>
                    {item.title && (
                      <div className="mt-1 truncate text-[11px] text-slate-200">
                        {item.title}
                      </div>
                    )}
                    {item.learnerFullName && (
                      <div className="truncate text-[11px] text-slate-400">
                        {item.learnerFullName}
                      </div>
                    )}
                    <div className="mt-1 text-[10px] text-slate-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-400">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
              How to use
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Ask the candidate to share their verification ID.</li>
              <li>Paste it in the field and click “Verify credential”.</li>
              <li>
                Only credentials issued and not revoked will show as valid. Expired
                or revoked credentials will be clearly marked.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default EmployerDashboard
