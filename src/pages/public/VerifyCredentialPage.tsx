import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { verifyCredential } from '../../api/verification'
import type { CredentialVerification } from '../../types/credential'

type StatusVariant = 'valid' | 'revoked' | 'invalid' | 'unknown'

const getStatusVariant = (result: CredentialVerification | null): StatusVariant => {
  if (!result) return 'unknown'
  if (!result.valid) return 'invalid'
  if (result.status && result.status.toUpperCase().includes('REVOK')) return 'revoked'
  return 'valid'
}

const VerifyCredentialPage: React.FC = () => {
  const params = useParams()
  const navigate = useNavigate()
  const [inputId, setInputId] = useState(params.credentialId ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CredentialVerification | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const runVerification = async (id: string) => {
    const trimmed = id.trim()
    if (!trimmed) return
    setError('')
    setLoading(true)
    setHasSearched(true)
    setResult(null)
    try {
      const data = await verifyCredential(trimmed)
      setResult(data)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Unable to verify this credential. Please check the ID and try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputId.trim()) return
    navigate(`/verify/${inputId.trim()}`, { replace: true })
    runVerification(inputId)
  }

  useEffect(() => {
    if (params.credentialId) {
      setInputId(params.credentialId)
      runVerification(params.credentialId)
    }
  }, [params.credentialId])

  const variant = getStatusVariant(result)

  const badgeClass =
    variant === 'valid'
      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
      : variant === 'revoked'
      ? 'bg-red-500/10 text-red-200 border-red-500/40'
      : variant === 'invalid'
      ? 'bg-amber-500/10 text-amber-200 border-amber-500/40'
      : 'bg-slate-700/40 text-slate-200 border-slate-600/60'

  const badgeLabel =
    variant === 'valid'
      ? 'Credential is valid'
      : variant === 'revoked'
      ? 'Credential is revoked'
      : variant === 'invalid'
      ? 'Credential is not valid'
      : 'Awaiting lookup'

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
              CredChain
            </p>
            <h1 className="text-xl font-semibold text-slate-50">
              Verify academic credential
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Enter or scan a Credential ID to verify its authenticity.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-5 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={inputId}
            onChange={e => setInputId(e.target.value)}
            placeholder="Enter credential public ID"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          />
          <button
            type="submit"
            disabled={loading || !inputId.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-slate-50 shadow-md shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </form>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/50 bg-red-950/40 px-3 py-2 text-xs text-red-100">
            {error}
          </div>
        )}

        {hasSearched && !loading && !error && (
          <div className="space-y-3">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] ${badgeClass}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              <span className="font-medium">{badgeLabel}</span>
            </div>

            {result ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-200 space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">
                      Credential
                    </div>
                    <div className="text-sm font-semibold text-slate-50">
                      {result.title || 'Untitled credential'}
                    </div>
                    {result.credentialType && (
                      <div className="text-[11px] text-slate-400">
                        {result.credentialType}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    <div className="font-mono text-[11px] text-slate-300">
                      ID: {result.publicId}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 mt-2">
                  {result.learnerFullName && (
                    <div>
                      <div className="text-[11px] text-slate-400">Learner</div>
                      <div className="text-xs text-slate-200">
                        {result.learnerFullName}
                      </div>
                    </div>
                  )}
                  {result.institutionName && (
                    <div>
                      <div className="text-[11px] text-slate-400">Institution</div>
                      <div className="text-xs text-slate-200">
                        {result.institutionName}
                      </div>
                    </div>
                  )}
                  {result.issuedAt && (
                    <div>
                      <div className="text-[11px] text-slate-400">Issued</div>
                      <div className="text-xs text-slate-200">
                        {new Date(result.issuedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {result.expiresAt && (
                    <div>
                      <div className="text-[11px] text-slate-400">Expires</div>
                      <div className="text-xs text-slate-200">
                        {new Date(result.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                {result.message && (
                  <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800 mt-2">
                    {result.message}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-300">
                No credential found for this ID.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default VerifyCredentialPage
