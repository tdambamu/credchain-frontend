import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import {
  getInstitutions,
  createInstitution,
  updateInstitution,
  deleteInstitution
} from '../../api/institutions'
import type { Institution, InstitutionStatus, InstitutionType } from '../../types/institution'

const statusOptions: InstitutionStatus[] = ['ACTIVE', 'INACTIVE']
const typeOptions: InstitutionType[] = ['UNIVERSITY', 'COLLEGE', 'SCHOOL', 'TRAINING_CENTER']

const InstitutionsPage: React.FC = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [type, setType] = useState<InstitutionType | ''>('')
  const [status, setStatus] = useState<InstitutionStatus>('ACTIVE')

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setCode('')
    setType('')
    setStatus('ACTIVE')
  }

  const loadInstitutions = async () => {
    setLoading(true)
    setError('')
    setInfo('')
    try {
      const list = await getInstitutions()
      setInstitutions(list)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to load institutions.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInstitutions()
  }, [])

  const validate = () => {
    const n = name.trim()
    const c = code.trim()
    if (!n) return 'Institution name is required.'
    if (n.length > 200) return 'Institution name must not exceed 200 characters.'
    if (!c) return 'Institution code is required.'
    if (c.length > 50) return 'Institution code must not exceed 50 characters.'
    if (!type) return 'Institution type is required.'
    if (!status) return 'Institution status is required.'
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

    const payload = {
      name: name.trim(),
      code: code.trim(),
      type: type || 'UNIVERSITY',
      status: status || 'ACTIVE'
    }

    setSaving(true)
    try {
      if (editingId) {
        const updated = await updateInstitution(editingId, payload)
        setInstitutions(prev => prev.map(inst => (inst.id === updated.id ? updated : inst)))
        setInfo(`Institution "${updated.name}" updated successfully.`)
      } else {
        const created = await createInstitution(payload)
        setInstitutions(prev => [created, ...prev])
        setInfo(`Institution "${created.name}" created successfully.`)
      }
      resetForm()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (editingId ? 'Failed to update institution.' : 'Failed to create institution.')
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleEditClick = (inst: Institution) => {
    setEditingId(inst.id)
    setName(inst.name)
    setCode(inst.code)
    setType(inst.type)
    setStatus((inst.status as InstitutionStatus) || 'ACTIVE')
    setError('')
    setInfo('')
  }

  const handleDeleteClick = async (inst: Institution) => {
    if (!window.confirm(`Delete institution "${inst.name}"? This cannot be undone.`)) {
      return
    }
    setError('')
    setInfo('')
    try {
      await deleteInstitution(inst.id)
      setInstitutions(prev => prev.filter(i => i.id !== inst.id))
      if (editingId === inst.id) {
        resetForm()
      }
      setInfo(`Institution "${inst.name}" deleted.`)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to delete institution.'
      setError(msg)
    }
  }

  return (
    <DashboardLayout title="Institutions">
      <div className="space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h1 className="text-lg font-semibold text-slate-50">Institutions</h1>
          {loading && (
            <span className="text-xs text-slate-400">Loading institutions…</span>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/60 bg-red-950/40 px-3 py-2 text-xs text-red-100">
            {error}
          </div>
        )}

        {info && !error && (
          <div className="rounded-lg border border-emerald-600/60 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-100">
            {info}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-[2fr,1.2fr]">
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80">
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-xs text-slate-400">
              <span>Existing institutions</span>
              {loading && <span className="text-[11px] text-slate-500">Loading…</span>}
            </div>
            <table className="min-w-full text-left text-xs text-slate-200">
              <thead className="border-b border-slate-800 bg-slate-900/90 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map(inst => (
                  <tr
                    key={inst.id}
                    className="border-b border-slate-800/70 last:border-0 hover:bg-slate-800/40"
                  >
                    <td className="px-3 py-2 text-[11px] md:text-xs">{inst.name}</td>
                    <td className="px-3 py-2 text-[11px] md:text-xs font-mono text-slate-300">
                      {inst.code}
                    </td>
                    <td className="px-3 py-2 text-[11px] md:text-xs">{inst.type}</td>
                    <td className="px-3 py-2 text-[11px] md:text-xs">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          inst.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-700/40 text-slate-200 border border-slate-600/60'
                        }`}
                      >
                        {inst.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[11px] md:text-xs text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(inst)}
                        className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-100 hover:bg-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(inst)}
                        className="rounded-md border border-red-600/70 bg-red-900/70 px-2 py-1 text-[11px] text-red-50 hover:bg-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {!institutions.length && !loading && !error && (
                  <tr>
                    <td
                      className="px-3 py-4 text-center text-[11px] text-slate-500"
                      colSpan={5}
                    >
                      No institutions yet. Create the first one using the form.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs">
            <h2 className="mb-2 text-sm font-semibold text-slate-50">
              {editingId ? 'Edit institution' : 'Add new institution'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-200 text-[11px]">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-2 py-1.5 text-xs text-slate-50 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  placeholder="e.g. University of Zimbabwe"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-200 text-[11px]">Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-2 py-1.5 text-xs text-slate-50 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  placeholder="e.g. UZ"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-200 text-[11px]">Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as InstitutionType)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-2 py-1.5 text-xs text-slate-50 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                >
                  <option value="">Select type</option>
                  {typeOptions.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-200 text-[11px]">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as InstitutionStatus)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-2 py-1.5 text-xs text-slate-50 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                >
                  {statusOptions.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-900/70"
                >
                  {saving
                    ? editingId
                      ? 'Saving…'
                      : 'Creating…'
                    : editingId
                    ? 'Save changes'
                    : 'Create institution'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default InstitutionsPage
