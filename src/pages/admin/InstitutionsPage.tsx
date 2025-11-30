import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { getInstitutions, createInstitution } from '../../api/institutions'
import type { Institution, InstitutionStatus, InstitutionType } from '../../types/institution'

const statusOptions: InstitutionStatus[] = ['ACTIVE', 'INACTIVE']
const typeOptions: InstitutionType[] = ['UNIVERSITY', 'COLLEGE', 'SCHOOL', 'TRAINING_CENTER']

const InstitutionsPage: React.FC = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [type, setType] = useState<InstitutionType>('UNIVERSITY')
  const [status, setStatus] = useState<InstitutionStatus>('ACTIVE')
  const [creating, setCreating] = useState(false)

  const loadInstitutions = async () => {
    setLoading(true)
    setError('')
    setInfo('')
    try {
      const data = await getInstitutions()
      setInstitutions(data)
      if (!data.length) {
        setInfo('No institutions found. Use the form below to add the first one.')
      }
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')

    const v = validate()
    if (v) {
      setError(v)
      return
    }

    setCreating(true)
    try {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        type: type.trim(),
        status: status.trim()
      }
      const created = await createInstitution(payload)
      setInstitutions(prev => [created, ...prev])
      setInfo(`Institution "${created.name}" created successfully.`)
      setName('')
      setCode('')
      setType('UNIVERSITY')
      setStatus('ACTIVE')
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to create institution.'
      setError(msg)
    } finally {
      setCreating(false)
    }
  }

  return (
    <DashboardLayout title="Institutions">
      <div className="space-y-5">
        <div className="text-xs text-slate-400">
          Manage higher education institutions onboarded onto CredChain. These institutions can
          issue and manage academic credentials.
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

        <div className="grid gap-4 md:grid-cols-[2fr,1.2fr]">
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80">
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-xs text-slate-400">
              <span>Institutions</span>
              {loading && <span className="text-[11px] text-slate-500">Loading…</span>}
            </div>
            <table className="min-w-full text-xs text-left text-slate-200">
              <thead className="border-b border-slate-800 bg-slate-900/90 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map(inst => (
                  <tr
                    key={inst.id}
                    className="border-t border-slate-800/80 hover:bg-slate-900"
                  >
                    <td className="px-3 py-2">
                      <div className="text-xs text-slate-50">{inst.name}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-200">
                        {inst.code}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-300">
                      {inst.type}
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-200">
                        {inst.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-400">
                      {inst.createdAt
                        ? new Date(inst.createdAt).toLocaleDateString()
                        : '-'}
                    </td>
                  </tr>
                ))}

                {!institutions.length && !loading && !error && (
                  <tr>
                    <td
                      className="px-3 py-4 text-center text-[11px] text-slate-500"
                      colSpan={5}
                    >
                      No institutions to display yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs">
            <h2 className="mb-2 text-sm font-semibold text-slate-50">
              Add new institution
            </h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-200">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Masvingo University of Technology"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-200">Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MUT-001"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-200">Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as InstitutionType)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                >
                  {typeOptions.map(opt => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-200">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as InstitutionStatus)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                >
                  {statusOptions.map(opt => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="mt-1 inline-flex items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-slate-50 shadow-md shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? 'Creating…' : 'Create institution'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default InstitutionsPage
