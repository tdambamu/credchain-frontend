import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getLearnersForInstitution } from '../../api/learners'
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
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [learnerId, setLearnerId] = useState('')
  const [credentialType, setCredentialType] = useState('DEGREE')
  const [title, setTitle] = useState('') // programme title
  const [description, setDescription] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

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
            'No learners found for this institution yet. You may need to create learners first.'
          )
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Failed to load learners for this institution.'
        setError(msg)
      } finally {
        setLoadingLearners(false)
      }
    }

    loadLearners()
  }, [user?.institutionId])

  const validate = () => {
    if (!user?.id || !user.institutionId) {
      return 'Issuer account is missing required identifiers.'
    }

    const l = learnerId.trim()
    const ct = credentialType.trim()
    const t = title.trim()
    const d = description.trim()
    const exp = expiresAt.trim()

    if (!l) return 'Learner is required.'
    if (!/^\d+$/.test(l)) return 'Invalid learner selection.'
    if (!ct) return 'Credential type is required.'
    if (ct.length > 50) return 'Credential type must not exceed 50 characters.'
    if (!t) return 'Programme title is required.'
    if (t.length > 200) return 'Programme title must not exceed 200 characters.'
    if (d && d.length > 1000) {
      return 'Description must not exceed 1000 characters.'
    }

    if (exp) {
      const today = new Date()
      const expDate = new Date(exp)
      today.setHours(0, 0, 0, 0)
      expDate.setHours(0, 0, 0, 0)
      if (expDate < today) {
        return 'Expiry date must be today or in the future.'
      }
    }

    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')

    const v = validate()
    if (v) {
      setError(v)
      return
    }

    if (!user?.id || !user.institutionId) {
      setError('Issuer account is missing required identifiers.')
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
      setInfo(
        `Credential issued for ${created.learnerName}. Verification link: ${verifyUrl}`
      )
      setLearnerId('')
      setCredentialType('DEGREE')
      setTitle('')
      setDescription('')
      setExpiresAt('')
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to issue credential.'
      setError(msg)
    } finally {
      setFormLoading(false)
    }
  }

  const learnersOptions = learners

  return (
    <DashboardLayout title="Issue credential">
      <div className="space-y-5">
        <div className="text-xs text-slate-400">
          Issue a new credential for a learner in your institution. All actions are
          recorded in the backend and can be verified via the public verification
          page.
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

        <div className="grid gap-4 md:grid-cols-[1.8fr,1.2fr]">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs">
            <h2 className="mb-2 text-sm font-semibold text-slate-50">
              Credential details
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-200">Learner</label>
                <select
                  value={learnerId}
                  onChange={e => setLearnerId(e.target.value)}
                  disabled={loadingLearners || !learnersOptions.length}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 disabled:opacity-60"
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

              <div className="space-y-1">
                <label className="text-slate-200">Credential type</label>
                <input
                  type="text"
                  value={credentialType}
                  onChange={e => setCredentialType(e.target.value)}
                  placeholder="e.g. DEGREE, CERTIFICATE, DIPLOMA"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-200">Programme title</label>
                <select
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                >
                  <option value="">Select programme</option>
                  {programmeOptions.map(p => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-200">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Include classification, honours, or additional notes if needed."
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
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
                <p className="text-[11px] text-slate-500">
                  Leave blank for non-expiring credentials.
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  formLoading ||
                  loadingLearners ||
                  !learnersOptions.length ||
                  !user?.institutionId
                }
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-slate-50 shadow-md shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {formLoading ? 'Issuing…' : 'Issue credential'}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs space-y-2">
            <h2 className="text-sm font-semibold text-slate-50">
              How this works
            </h2>
            <p className="text-slate-300">
              When you issue a credential, it is stored in CredChain with a unique
              public identifier. Employers and third parties can verify it using the
              public verification page without seeing your internal IDs.
            </p>
            <p className="text-slate-400">
              The issuer user ID and institution ID come from your authenticated
              session, so you do not have to select them manually.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default IssueCredentialPage
