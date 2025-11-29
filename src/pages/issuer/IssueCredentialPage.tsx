import React, { useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { issueCredential } from '../../api/credentials'
import type { CredentialIssuePayload } from '../../types/credential'

const IssueCredentialPage: React.FC = () => {
  const { user } = useAuth()
  const [learnerId, setLearnerId] = useState('')
  const [credentialType, setCredentialType] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const validate = () => {
    if (!user?.institutionId) {
      return 'Your account is not linked to an institution.'
    }

    const learner = learnerId.trim()
    if (!learner) return 'Learner ID is required.'
    if (!/^\d+$/.test(learner)) return 'Learner ID must be a number.'

    const type = credentialType.trim()
    if (!type) return 'Credential type is required.'
    if (type.length > 100) return 'Credential type must not exceed 100 characters.'

    const t = title.trim()
    if (!t) return 'Title is required.'
    if (t.length > 200) return 'Title must not exceed 200 characters.'

    const desc = description.trim()
    if (desc.length > 2000) return 'Description must not exceed 2000 characters.'

    if (expiresAt) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const exp = new Date(expiresAt)
      if (isNaN(exp.getTime())) {
        return 'Expiry date is not valid.'
      }
      exp.setHours(0, 0, 0, 0)
      if (exp < today) {
        return 'Expiry date must be today or in the future.'
      }
    }

    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!user?.institutionId) return

    const payload: CredentialIssuePayload = {
      learnerId: Number(learnerId.trim()),
      institutionId: user.institutionId,
      credentialType: credentialType.trim(),
      title: title.trim(),
      description: description.trim() || undefined,
      expiresAt: expiresAt || undefined
    }

    setLoading(true)
    try {
      const created = await issueCredential(payload)
      setSuccessMessage(
        `Credential issued successfully. Public ID: ${created.publicId ?? 'N/A'}`
      )
      // Optionally clear the form except learnerId
      setCredentialType('')
      setTitle('')
      setDescription('')
      setExpiresAt('')
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to issue credential. Please check the details and try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Issue credential">
      <div className="max-w-xl space-y-4">
        <div className="text-xs text-slate-400">
          Issue a new credential for a learner. All fields should match the official
          academic record.
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/60 bg-red-950/40 px-3 py-2 text-xs text-red-100">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-lg border border-emerald-500/60 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-100">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="text-slate-200">Learner ID</label>
            <input
              type="text"
              value={learnerId}
              onChange={e => setLearnerId(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              placeholder="Enter learner ID from the system"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-200">Issuing institution</label>
            <input
              type="text"
              value={user?.institutionName ?? 'Not linked'}
              disabled
              className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-200">Credential type</label>
            <input
              type="text"
              value={credentialType}
              onChange={e => setCredentialType(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              placeholder="e.g. DEGREE, DIPLOMA, CERTIFICATE"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-200">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              placeholder="e.g. BSc Computer Science"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-200">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              placeholder="Additional notes, classification, distinctions, etc."
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-200">Expiry date (optional)</label>
            <input
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-slate-50 shadow-md shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Issuing…' : 'Issue credential'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default IssueCredentialPage
