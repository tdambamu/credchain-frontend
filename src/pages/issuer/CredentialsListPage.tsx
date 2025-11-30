import React, { useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { getCredentialsForLearner, revokeCredential } from '../../api/credentials'
import type { Credential } from '../../types/credential'

const CredentialsListPage: React.FC = () => {
  const [learnerIdInput, setLearnerIdInput] = useState('')
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setCredentials([])

    const trimmed = learnerIdInput.trim()
    if (!trimmed) {
      setError('Please enter a learner ID.')
      return
    }
    if (!/^\d+$/.test(trimmed)) {
      setError('Learner ID must be a number.')
      return
    }

    setLoading(true)
    try {
      const data = await getCredentialsForLearner(Number(trimmed))
      setCredentials(data)
      if (!data.length) {
        setInfo('No credentials found for this learner.')
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to fetch credentials for this learner.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (publicId: string) => {
    if (!publicId) return
    const confirmRevoke = window.confirm(
      `Are you sure you want to revoke credential ${publicId}?`
    )
    if (!confirmRevoke) return

    setLoading(true)
    setError('')
    setInfo('')
    try {
      const updated = await revokeCredential(publicId)
      setCredentials(prev =>
        prev.map(c => (c.publicId === updated.publicId ? updated : c))
      )
      setInfo(`Credential ${publicId} was revoked.`)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to revoke this credential.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Learner credentials">
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row text-xs">
          <input
            type="text"
            value={learnerIdInput}
            onChange={e => setLearnerIdInput(e.target.value)}
            placeholder="Enter learner ID"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-slate-50 shadow-md shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Loading…' : 'Search'}
          </button>
        </form>

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

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80">
          <table className="min-w-full text-xs text-left text-slate-200">
            <thead className="border-b border-slate-800 bg-slate-900/90 text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">Public ID</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Issued at</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {credentials.map(cred => (
                <tr
                  key={cred.id ?? cred.publicId}
                  className="border-t border-slate-800/80 hover:bg-slate-900"
                >
                  <td className="px-3 py-2 font-mono text-[11px] text-slate-300">
                    {cred.publicId}
                  </td>
                  <td className="px-3 py-2">
                    {cred.title ?? <span className="text-slate-500">Untitled</span>}
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                      {cred.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-300">
                    {cred.issuedAt
                      ? new Date(cred.issuedAt).toLocaleString()
                      : '-'}
                  </td>
                  <td className="px-3 py-2 space-x-2">
                    <a
                      href={`/verify/${cred.publicId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-indigo-300 hover:text-indigo-200"
                    >
                      View / Verify
                    </a>
                    {cred.status !== 'REVOKED' && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(cred.publicId)}
                        className="text-[11px] text-red-300 hover:text-red-200"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {!credentials.length && !error && !loading && (
                <tr>
                  <td
                    className="px-3 py-4 text-center text-[11px] text-slate-500"
                    colSpan={5}
                  >
                    No credentials to display. Search by learner ID to see issued
                    credentials.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CredentialsListPage
