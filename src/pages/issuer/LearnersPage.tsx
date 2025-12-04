import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import {
  getLearners,
  createLearner,
  updateLearner,
  deleteLearner,
  type LearnerCreatePayload
} from '../../api/learners'
import type { Learner } from '../../types/learner'
import type { PageResponse } from '../../types/pagination'

const LearnersPage: React.FC = () => {
  const { user } = useAuth()
  const [pageData, setPageData] = useState<PageResponse<Learner> | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [page] = useState(0)
  const [size] = useState(50)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')

  const resetForm = () => {
    setEditingId(null)
    setFirstName('')
    setLastName('')
    setEmail('')
    setStudentNumber('')
    setNationalId('')
    setDateOfBirth('')
  }

  const validateForm = (): string | null => {
    const fn = firstName.trim()
    const ln = lastName.trim()
    const e = email.trim()

    if (!fn) return 'First name is required.'
    if (fn.length > 100) return 'First name must not exceed 100 characters.'
    if (!ln) return 'Last name is required.'
    if (ln.length > 100) return 'Last name must not exceed 100 characters.'
    if (!e) return 'Email is required.'
    if (!e.includes('@') || e.length > 150) {
      return 'Email must be a valid address and not exceed 150 characters.'
    }

    return null
  }

  const loadLearners = async () => {
    setLoading(true)
    setError('')
    setInfo('')

    try {
      const data = await getLearners({ page, size })
      setPageData(data)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to load learners.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLearners()
  }, [page])

  const onEdit = (learner: Learner) => {
    setEditingId(learner.id)
    setFirstName(learner.firstName || '')
    setLastName(learner.lastName || '')
    setEmail(learner.email || '')
    setStudentNumber(learner.studentNumber || '')
    setNationalId(learner.nationalId || '')
    setDateOfBirth(learner.dateOfBirth || '')
  }

  const onDelete = async (learner: Learner) => {
    const ok = window.confirm(
      `Delete learner "${learner.firstName} ${learner.lastName}"?`
    )
    if (!ok) return

    setSaving(true)
    setError('')
    setInfo('')

    try {
      await deleteLearner(learner.id)
      setInfo('Learner deleted.')
      await loadLearners()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to delete learner.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validateForm()
    if (validation) {
      setError(validation)
      return
    }

    const payload: LearnerCreatePayload = {
      firstName,
      lastName,
      email,
      studentNumber: studentNumber || undefined,
      nationalId: nationalId || undefined,
      dateOfBirth: dateOfBirth || undefined,
      institutionId: user?.institutionId ?? undefined
    }

    setSaving(true)
    setError('')
    setInfo('')

    try {
      if (editingId) {
        const updated = await updateLearner(editingId, payload)
        setInfo(`Learner "${updated.firstName} ${updated.lastName}" updated.`)
      } else {
        const created = await createLearner(payload)
        setInfo(`Learner "${created.firstName} ${created.lastName}" created.`)
      }
      resetForm()
      await loadLearners()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to save learner.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const learners = pageData?.content ?? []

  return (
    <DashboardLayout title="Learners">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-medium text-slate-100">
            Manage learners for your institution
          </div>
          <div className="text-xs text-slate-400">
            Make sure the learner email matches the login email you will give
            them as a user.
          </div>
        </div>
        <div className="text-xs text-slate-500">
          Institution:{' '}
          <span className="font-semibold text-slate-100">
            {user?.institutionName || 'N/A'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {info && (
        <div className="mb-3 rounded-md border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-200">
          {info}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="mb-3 text-sm font-semibold text-slate-100">
          {editingId ? 'Edit learner' : 'Add learner'}
        </div>
        <form
          onSubmit={onSubmit}
          className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">First name</label>
            <input
              className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none focus:border-sky-500"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Last name</label>
            <input
              className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none focus:border-sky-500"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Email</label>
            <input
              type="email"
              className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none focus:border-sky-500"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Student number</label>
            <input
              className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none focus:border-sky-500"
              value={studentNumber}
              onChange={e => setStudentNumber(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">National ID</label>
            <input
              className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none focus:border-sky-500"
              value={nationalId}
              onChange={e => setNationalId(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Date of birth</label>
            <input
              type="date"
              className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none focus:border-sky-500"
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
            />
          </div>

          <div className="mt-2 flex gap-2 md:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingId ? 'Update learner' : 'Create learner'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div className="text-sm font-semibold text-slate-100">
            Learners ({learners.length})
          </div>
          {loading && (
            <div className="text-xs text-slate-400">Loading learners…</div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-[11px] uppercase text-slate-400">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Student no.</th>
                <th className="px-4 py-2">National ID</th>
                <th className="px-4 py-2">Date of birth</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {learners.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-4 text-center text-xs text-slate-500"
                  >
                    No learners yet. Add one using the form above.
                  </td>
                </tr>
              )}

              {learners.map(learner => (
                <tr
                  key={learner.id}
                  className="border-t border-slate-800/80 hover:bg-slate-900"
                >
                  <td className="px-4 py-2">
                    <div className="font-medium text-slate-100">
                      {learner.firstName} {learner.lastName}
                    </div>
                  </td>
                  <td className="px-4 py-2">{learner.email}</td>
                  <td className="px-4 py-2">
                    {learner.studentNumber || <span className="text-slate-500">-</span>}
                  </td>
                  <td className="px-4 py-2">
                    {learner.nationalId || <span className="text-slate-500">-</span>}
                  </td>
                  <td className="px-4 py-2">
                    {learner.dateOfBirth || <span className="text-slate-500">-</span>}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => onEdit(learner)}
                      className="mr-2 text-xs text-sky-400 hover:text-sky-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(learner)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default LearnersPage
