import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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

const getStatusVariant = (result: CredentialVerification | null): 'valid' | 'revoked' | 'invalid' | 'unknown' => {
  if (!result) return 'unknown'
  if (!result.valid) {
    if (result.status && result.status.toString().toUpperCase().includes('REVOK')) {
      return 'revoked'
    }
    if (result.status && result.status.toString().toUpperCase().includes('EXPIRED')) {
      return 'revoked'
    }
    return 'invalid'
  }
  return 'valid'
}

const VerifyCredentialPage: React.FC = () => {
  const params = useParams()
  const [credentialId, setCredentialId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CredentialVerification | null>(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    const raw = window.localStorage.getItem(HISTORY_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as HistoryItem[]
      setHistory(parsed)
    } catch {
      window.localStorage.removeItem(HISTORY_KEY)
    }
  }, [])

  useEffect(() => {
    const idFromUrl = params.credentialId
    if (idFromUrl) {
      setCredentialId(idFromUrl)
      handleVerify(idFromUrl)
    }
  }, [params.credentialId])

  const persistHistory = (items: HistoryItem[]) => {
    setHistory(items)
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 20)))
  }

  const addToHistory = (res: CredentialVerification) => {
    const item: HistoryItem = {
      publicId: res.publicId,
      timestamp: new Date().toISOString(),
      valid: res.valid,
      status: res.status?.toString() ?? '',
      title: res.title,
      learnerFullName: res.learnerFullName
    }
    const existing = history.filter(h => h.publicId !== item.publicId)
    persistHistory([item, ...existing])
  }

  const handleVerify = async (id?: string) => {
    const value = id ?? credentialId
    if (!value.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await verifyCredential(value.trim())
      setResult(data)
      addToHistory(data)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleVerify()
  }

  const handleLoadFromHistory = (item: HistoryItem) => {
    setCredentialId(item.publicId)
    setResult({
      publicId: item.publicId,
      valid: item.valid,
      status: item.status,
      message: '',
      credentialType: null,
      title: item.title ?? null,
      learnerFullName: item.learnerFullName ?? null,
      institutionName: null,
      issuedAt: null,
      expiresAt: null,
      revokedAt: null
    })
    setError('')
  }

  const clearHistory = () => {
    persistHistory([])
  }

  const statusVariant = getStatusVariant(result)

  const statusStyles =
    statusVariant === 'valid'
      ? 'bg-emerald-500/15 text-emerald-100 border border-emerald-500/40'
      : statusVariant === 'revoked'
      ? 'bg-amber-500/15 text-amber-100 border border-amber-500/40'
      : statusVariant === 'invalid'
      ? 'bg-red-500/15 text-red-100 border border-red-500/40'
      : 'bg-slate-500/15 text-slate-100 border border-slate-500/40'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 lg:flex-row">
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">Employer verification console</h1>
            <p className="mt-1 text-xs text-slate-400">
              Verify a candidate&apos;s credential using the Credential ID printed on the certificate or
              embedded in the QR code.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs sm:flex-row"
          >
            <input
              type="text"
              value={credentialId}
              onChange={e => setCredentialId(e.target.value)}
              placeholder="Enter credential ID"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <button
              type="submit"
              disabled={loading || !credentialId.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-slate-50 shadow-md shadow-indigo-500/30 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {loading ? 'Verifying…' : 'Verify credential'}
            </button>
          </form>

          {error && (
            <div className="rounded-lg border border-red-500/60 bg-red-950/40 px-3 py-2 text-xs text-red-100">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/90 p-4 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">
                    Verification result
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-50">
                    {result.title || 'Credential'}
                  </div>
                  {result.learnerFullName && (
                    <div className="text-[11px] text-slate-300">
                      {result.learnerFullName}
                    </div>
                  )}
                  {result.institutionName && (
                    <div className="text-[11px] text-slate-400">
                      {result.institutionName}
                    </div>
                  )}
                </div>
                <span
                  className={
                    'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ' +
                    statusStyles
                  }
                >
                  {statusVariant === 'valid'
                    ? 'VALID'
                    : statusVariant === 'revoked'
                    ? 'NO LONGER VALID'
                    : statusVariant === 'invalid'
                    ? 'INVALID'
                    : 'UNKNOWN'}
                </span>
              </div>

              <div className="grid gap-2 border-t border-slate-800 pt-3 text-[11px] text-slate-300 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-slate-400">Credential ID</div>
                  <div className="font-mono text-[10px] text-slate-100">
                    {result.publicId}
                  </div>
                </div>
                {result.issuedAt && (
                  <div className="space-y-1">
                    <div className="text-slate-400">Issued</div>
                    <div>{new Date(result.issuedAt).toLocaleDateString()}</div>
                  </div>
                )}
                {result.expiresAt && (
                  <div className="space-y-1">
                    <div className="text-slate-400">Expires</div>
                    <div>{new Date(result.expiresAt).toLocaleDateString()}</div>
                  </div>
                )}
                {result.revokedAt && (
                  <div className="space-y-1">
                    <div className="text-slate-400">Revoked</div>
                    <div>{new Date(result.revokedAt).toLocaleString()}</div>
                  </div>
                )}
              </div>

              {result.message && (
                <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-[11px] text-slate-300">
                  {result.message}
                </div>
              )}
            </div>
          )}

          {!result && !error && !loading && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-300">
              Enter a credential ID to verify its authenticity. This console is designed for employers and
              professional bodies to quickly validate academic records.
            </div>
          )}
        </div>

        <div className="w-full max-w-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-200">
              Recent verifications
            </div>
            {history.length > 0 && (
              <button
                type="button"
                onClick={clearHistory}
                className="text-[11px] text-slate-400 hover:text-red-200"
              >
                Clear
              </button>
            )}
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs">
            {history.length === 0 ? (
              <div className="py-4 text-center text-[11px] text-slate-500">
                No verifications recorded yet on this device.
              </div>
            ) : (
              <ul className="space-y-2">
                {history.map(item => (
                  <li
                    key={item.publicId + item.timestamp}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-[11px] hover:bg-slate-800"
                    onClick={() => handleLoadFromHistory(item)}
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] text-slate-100">
                        {item.publicId}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.learnerFullName || item.title || 'Credential'}
                      </span>
                    </div>
                    <span
                      className={
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold ' +
                        (item.valid
                          ? 'bg-emerald-500/15 text-emerald-100 border border-emerald-500/40'
                          : 'bg-red-500/15 text-red-100 border border-red-500/40')
                      }
                    >
                      {item.valid ? 'VALID' : item.status || 'INVALID'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyCredentialPage
