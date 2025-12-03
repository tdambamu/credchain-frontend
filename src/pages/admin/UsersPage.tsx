import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { getUsersPage, createUser, updateUser, deleteUser } from '../../api/users'
import { getInstitutions } from '../../api/institutions'
import type { User } from '../../types/user'
import type { Institution } from '../../types/institution'
import type { Role } from '../../types/auth'
import type { PageResponse } from '../../types/pagination'
import { useAuth } from '../../context/AuthContext'

const roleOptions: { label: string; value: Role }[] = [
  { label: 'System admin', value: 'SYSTEM_ADMIN' },
  { label: 'Institution admin', value: 'INSTITUTION_ADMIN' },
  { label: 'Issuer', value: 'ISSUER' },
  { label: 'Learner', value: 'LEARNER' },
  { label: 'Employer', value: 'EMPLOYER' }
]

const formatRoleLabel = (role: Role) => {
  if (role === 'SYSTEM_ADMIN') return 'System admin'
  if (role === 'INSTITUTION_ADMIN') return 'Institution admin'
  if (role === 'ISSUER') return 'Issuer'
  if (role === 'LEARNER') return 'Learner'
  if (role === 'EMPLOYER') return 'Employer'
  return 'Unknown'
}

const UsersPage: React.FC = () => {
  const { user: authUser } = useAuth()
  const isInstitutionAdmin = authUser?.appRole === 'INSTITUTION_ADMIN'
  const myInstitutionId = authUser?.institutionId ?? null

  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [usersPage, setUsersPage] = useState<PageResponse<User> | null>(null)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [page, setPage] = useState(0)
  const [size] = useState(20)
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL')

  const [editingUserId, setEditingUserId] = useState<number | null>(null)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [institutionId, setInstitutionId] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(['ISSUER'])
  const [enabled, setEnabled] = useState(true)

  const loadData = async () => {
    setLoading(true)
    setError('')
    setInfo('')
    try {
      if (!isInstitutionAdmin) {
        const insts = await getInstitutions()
        setInstitutions(insts)
      }

      const params: any = { page, size }
      if (roleFilter !== 'ALL') params.role = roleFilter

      const pageRes = await getUsersPage(params)
      setUsersPage(pageRes)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to load users.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, roleFilter])

  const toggleRole = (role: Role) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  const resetForm = () => {
    setEditingUserId(null)
    setUsername('')
    setEmail('')
    setPassword('')
    if (!isInstitutionAdmin) {
      setInstitutionId('')
    }
    setSelectedRoles(['ISSUER'])
    setEnabled(true)
  }

  const validate = () => {
    const u = username.trim()
    const e = email.trim()
    const p = password.trim()
    const inst = institutionId.trim()

    if (!u) return 'Username is required.'
    if (u.length > 100) return 'Username must not exceed 100 characters.'
    if (!e) return 'Email is required.'
    if (!e.includes('@') || e.length > 150) {
      return 'Email must be a valid address and not exceed 150 characters.'
    }

    if (!editingUserId) {
      if (!p) return 'Password is required.'
      if (p.length < 6 || p.length > 100) {
        return 'Password must be between 6 and 100 characters.'
      }
    } else if (p) {
      if (p.length < 6 || p.length > 100) {
        return 'New password must be between 6 and 100 characters.'
      }
    }

    if (isInstitutionAdmin) {
      if (!myInstitutionId) return 'Your account is not linked to an institution.'
    } else {
      if (!inst) return 'Institution is required.'
      if (!/^\d+$/.test(inst)) return 'Institution ID must be numeric.'
    }

    if (selectedRoles.length === 0) {
      return 'At least one role is required.'
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

    const baseInstitutionId =
      isInstitutionAdmin && myInstitutionId
        ? myInstitutionId
        : Number(institutionId.trim())

    if (!baseInstitutionId || Number.isNaN(baseInstitutionId)) {
      setError('A valid institution is required.')
      return
    }

    setSaving(true)
    try {
      if (editingUserId) {
        const payload = {
          username: username.trim(),
          email: email.trim(),
          password: password.trim() || undefined,
          institutionId: isInstitutionAdmin ? undefined : baseInstitutionId,
          roles: selectedRoles,
          enabled
        }
        const updated = await updateUser(editingUserId, payload)
        setInfo(`User "${updated.username}" updated successfully.`)
      } else {
        const payload = {
          username: username.trim(),
          email: email.trim(),
          password: password.trim(),
          institutionId: baseInstitutionId,
          roles: selectedRoles,
          enabled
        }
        const created = await createUser(payload)
        setInfo(`User "${created.username}" created successfully.`)
      }
      resetForm()
      await loadData()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (editingUserId ? 'Failed to update user.' : 'Failed to create user.')
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleEditClick = (user: User) => {
    setEditingUserId(user.id)
    setUsername(user.username)
    setEmail(user.email)
    if (!isInstitutionAdmin && user.institutionId) {
      setInstitutionId(String(user.institutionId))
    }
    setSelectedRoles(user.roles.length ? user.roles : ['ISSUER'])
    setEnabled(user.enabled)
    setPassword('')
    setError('')
    setInfo('')
  }

  const handleDeleteClick = async (user: User) => {
    if (!window.confirm(`Delete user "${user.username}"? This cannot be undone.`)) {
      return
    }
    setError('')
    setInfo('')
    try {
      await deleteUser(user.id)
      setInfo(`User "${user.username}" deleted.`)
      await loadData()
      if (editingUserId === user.id) {
        resetForm()
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to delete user.'
      setError(msg)
    }
  }

  const institutionsForSelect = institutions
  const roleOptionsForCurrentUser = isInstitutionAdmin
    ? roleOptions.filter(r => r.value !== 'SYSTEM_ADMIN')
    : roleOptions

  const users = usersPage?.content ?? []
  const totalElements = usersPage?.totalElements ?? users.length
  const totalPages = usersPage?.totalPages ?? 1
  const isFirstPage = page === 0
  const isLastPage = usersPage?.last ?? true

  return (
    <DashboardLayout title="Users">
      <div className="space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-50">Users</h1>
            <p className="mt-1 text-xs text-slate-400">
              Manage system, institution admins and issuers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as Role | 'ALL')}
              className="rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1.5 text-[11px] text-slate-100 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            >
              <option value="ALL">All roles</option>
              {roleOptionsForCurrentUser.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {loading && (
              <span className="text-[11px] text-slate-400">Loading users…</span>
            )}
          </div>
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

        <div className="grid gap-4 md:grid-cols-[2fr,1.4fr]">
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80">
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-[11px] text-slate-400">
              <span>
                Users{' '}
                <span className="ml-1 text-[10px] text-slate-500">
                  ({totalElements} total)
                </span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isFirstPage}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-200 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
                >
                  Prev
                </button>
                <span className="text-[10px] text-slate-400">
                  Page {page + 1} of {totalPages || 1}
                </span>
                <button
                  type="button"
                  disabled={isLastPage}
                  onClick={() => setPage(p => p + 1)}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-200 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
                >
                  Next
                </button>
              </div>
            </div>
            <table className="min-w-full text-left text-xs text-slate-200">
              <thead className="border-b border-slate-800 bg-slate-900/90 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2">Username</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Institution</th>
                  <th className="px-3 py-2">Roles</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-800/70 last:border-0 hover:bg-slate-800/40"
                  >
                    <td className="px-3 py-2 text-[11px] md:text-xs">{u.username}</td>
                    <td className="px-3 py-2 text-[11px] md:text-xs">{u.email}</td>
                    <td className="px-3 py-2 text-[11px] md:text-xs">
                      {u.institutionName || '—'}
                    </td>
                    <td className="px-3 py-2 text-[11px] md:text-xs">
                      {u.roles.map(r => (
                        <span
                          key={r + u.id}
                          className="mr-1 inline-flex rounded-full bg-slate-800/70 px-2 py-0.5 text-[10px] text-slate-100"
                        >
                          {formatRoleLabel(r)}
                        </span>
                      ))}
                    </td>
                    <td className="px-3 py-2 text-[11px] md:text-xs">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          u.enabled
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-700/40 text-slate-200 border border-slate-600/60'
                        }`}
                      >
                        {u.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-[11px] md:text-xs space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(u)}
                        className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-100 hover:bg-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(u)}
                        className="rounded-md border border-red-600/70 bg-red-900/70 px-2 py-1 text-[11px] text-red-50 hover:bg-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {!users.length && !loading && !error && (
                  <tr>
                    <td
                      className="px-3 py-4 text-center text-[11px] text-slate-500"
                      colSpan={6}
                    >
                      No users to display yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs">
            <h2 className="mb-2 text-sm font-semibold text-slate-50">
              {editingUserId ? 'Edit user' : 'Add new user'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-200 text-[11px]">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. issuer1"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-2 py-1.5 text-xs text-slate-50 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-200 text-[11px]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. issuer1@example.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-2 py-1.5 text-xs text-slate-50 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-200 text-[11px]">
                  {editingUserId ? 'New password (optional)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={editingUserId ? 'Leave blank to keep current' : 'At least 6 characters'}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-2 py-1.5 text-xs text-slate-50 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-200 text-[11px]">Institution</label>
                {isInstitutionAdmin ? (
                  <input
                    disabled
                    value={authUser?.institutionName || `Institution ID ${myInstitutionId ?? ''}`}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-2 py-1.5 text-xs text-slate-400"
                  />
                ) : (
                  <select
                    value={institutionId}
                    onChange={e => setInstitutionId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-2 py-1.5 text-xs text-slate-50 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  >
                    <option value="">Select institution</option>
                    {institutionsForSelect.map(inst => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-slate-200 text-[11px]">Roles</label>
                <div className="flex flex-wrap gap-2">
                  {roleOptionsForCurrentUser.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleRole(option.value)}
                      className={`rounded-full border px-2 py-0.5 text-[11px] ${
                        selectedRoles.includes(option.value)
                          ? 'border-indigo-400 bg-indigo-500/20 text-indigo-100'
                          : 'border-slate-700 bg-slate-900/80 text-slate-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-1 text-[11px] text-slate-200">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={e => setEnabled(e.target.checked)}
                    className="h-3 w-3 rounded border border-slate-600 bg-slate-950"
                  />
                  Active
                </label>
                <div className="flex items-center gap-3">
                  {editingUserId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-[11px] text-slate-400 hover:text-slate-200"
                    >
                      Cancel edit
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-900/70"
                  >
                    {saving
                      ? editingUserId
                        ? 'Saving…'
                        : 'Creating…'
                      : editingUserId
                      ? 'Save changes'
                      : 'Create user'}
                  </button>
                </div>
              </div>
              {!institutionsForSelect.length && !isInstitutionAdmin && (
                <p className="mt-1 text-[11px] text-amber-300">
                  You need at least one institution before creating users.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default UsersPage
