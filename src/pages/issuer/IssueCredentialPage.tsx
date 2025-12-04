import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getLearners } from '../../api/learners'
import { issueCredential } from '../../api/credentials'
import type { Learner } from '../../types/learner'
import type { IssueCredentialPayload } from '../../api/credentials'

const programmeOptions: string[] = [
  'Bachelor of Science in Computer Science',
  'Bachelor of Commerce in Accounting',
  'Bachelor of Engineering in Electrical Engineering',
  'Diploma in Information Technology',
  'Diploma in Education',
  'Certificate in Project Management'
]

const IssueCredentialPage: React.FC = () => {
  const { user } = useAuth()

  const [learners, setLearners] = useState<Learner[]>([])
  const [loadingLearners, setLoadingLearners] = useState(false)
  const [learnerId, setLearnerId] = useState('')
  const [credentialType, setCredentialType] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [success, setSuccess] = useState('')

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
          'Failed to load learners for your account.'
        setError(msg)
      } finally {
        setLoadingLearners(false)
      }
    }

    loadLearners()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setSuccess('')

    if (!user || !user.id || !user.institutionId) {
      setError('Your account is not fully linked to an institution. Please contact support.')
      return
    }

    if (!learnerId.trim()) {
      setError('Please select a learner.')
      return
    }

    if (!credentialType.trim()) {
      setError('Please enter the credential type.')
      return
    }

    if (!title.trim()) {
      setError('Please enter the programme or qualification title.')
      return
    }

    const payload: IssueCredentialPayload = {
      learnerId: Number(learnerId.trim()),
      institutionId: user.institutionId,
      issuerUserId: user.id,
      credentialType: credentialType.trim(),
      title: title.trim(),
      description: description.trim() || undefined,
      expiresAt: expiresAt.trim() || undefined
    }

    setFormLoading(true)
    try {
      const created = await issueCredential(payload)
      const verifyUrl = `${window.location.origin}/verify/${created.publicId}`
      setSuccess(
        `Credential issued successfully. Share this verification link with third parties: ${verifyUrl}`
      )
      setDescription('')
      setExpiresAt('')
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to issue credential. Please try again.'
      setError(msg)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <DashboardLayout title="Issue Credential">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row">
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Issue new credential</h1>
            <p className="mt-1 text-sm text-slate-400">
              Select a learner from your institution and issue a verified credential that can be
              checked online by employers or other institutions.
            </p>
          </div>

          {error && (
            <div className="rounded border border-red-500 bg-red-950/60 px-4 py-2 text-sm text-red-100">
              {error}
            </div>
          )}

          {info && !error && (
            <div className="rounded border border-blue-500 bg-slate-900 px-4 py-2 text-sm text-blue-100">
              {info}
            </div>
          )}

          {success && (
            <div className="rounded border border-emerald-500 bg-emerald-950/60 px-4 py-2 text-sm text-emerald-100">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-slate-900 p-4 shadow">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-100">Learner</label>
                <select
                  value={learnerId}
                  onChange={e => setLearnerId(e.target.value)}
                  disabled={loadingLearners || !learners.length || formLoading}
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {loadingLearners
                      ? 'Loading learners...'
                      : learners.length
                      ? 'Select learner'
                      : 'No learners available'}
                  </option>
                  {learners.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.firstName} {l.lastName}{' '}
                      {l.studentNumber ? `(${l.studentNumber})` : l.email ? `(${l.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-100">Credential type</label>
                <input
                  type="text"
                  value={credentialType}
                  onChange={e => setCredentialType(e.target.value)}
                  placeholder="Degree, Diploma, Certificate, Short course, etc."
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  disabled={formLoading}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-100">
                  Programme / qualification title
                </label>
                <select
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  disabled={formLoading}
                >
                  <option value="">Select from list or type below</option>
                  {programmeOptions.map(p => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-100">
                  Or type custom programme title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Bachelor of Commerce in Marketing"
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  disabled={formLoading}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-100">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Add brief notes about the credential, year of completion, classification, etc."
                  className="min-h-[120px] rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  disabled={formLoading}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-100">
                  Expiry date (optional)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  disabled={formLoading}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Leave blank for credentials that do not expire, such as degrees and diplomas.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                type="submit"
                disabled={formLoading || loadingLearners || !learners.length}
                className="inline-flex items-center justify-center rounded-md border border-emerald-500 bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {formLoading ? 'Issuing credential…' : 'Issue credential'}
              </button>
              <p className="text-xs text-slate-400">
                A public verification link will be generated automatically after issuing.
              </p>
            </div>
          </form>
        </div>

        <div className="w-full max-w-md space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              How verification works
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              When you issue a credential, the system generates a unique public ID that can be
              shared with employers and other institutions. They can verify it online without
              seeing your internal student numbers or IDs.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Security and roles
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Only authenticated users with issuer or admin roles in your institution can issue
              credentials. All actions are logged for audit purposes.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default IssueCredentialPage
