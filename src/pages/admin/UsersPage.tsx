import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { getUsers, createUser } from '../../api/users'
import { getInstitutions } from '../../api/institutions'
import type { User } from '../../types/user'
import type { Institution } from '../../types/institution'
import type { Role } from '../../types/auth'
import { useAuth } from '../../context/AuthContext'

const roleOptions: { label: string; value: Role }[] = [
  { label: 'System admin', value: 'SYSTEM_ADMIN' },
  { label: 'Institution admin', value: 'INSTITUTION_ADMIN' },
  { label: 'Issuer', value: 'ISSUER' },
  { label: 'Learner', value: 'LEARNER' },
  { label: 'Employer', value: 'EMPLOYER' }
]

const formatRoleLabel = (role: Role): string => {
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

  const [users, setUsers] = useState<User[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [institutionId, setInstitutionId] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(['ISSUER'])
  const [enabled, setEnabled] = useState(true)
  const [creating, setCreating] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError('')
    setInfo('')
    try {
      if (isInstitutionAdmin && myInstitutionId) {
        const usersRes = await getUsers()
        const filteredUsers = usersRes.filter(u => u.institutionId === myInstitutionId)
        setUsers(filteredUsers)
        setInstitutions([])
        if (!filteredUsers.length) {
          setInfo('No users found. Use the form to add users for this institution.')
        }
      } else {
        const [usersRes, instRes] = await Promise.all([getUsers(), getInstitutions()])
        setUsers(usersRes)
        setInstitutions(instRes)
        if (!usersRes.length) {
          setInfo('No users found. Use the form to add users for this context.')
        }
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to load users or institutions.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleRole = (role: Role) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
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
    if (!p) return 'Password is required.'
    if (p.length < 6 || p.length > 100) {
      return 'Password must be between 6 and 100 characters.'
    }

    if (isInstitutionAdmin) {
      if (!myInstitutionId) return 'Your account is not linked to an institution.'
    } else {
      if (!inst) return 'Institution is required.'
      if (!/^\d+$/.test(inst)) return 'Institution ID must be a number.'
    }

    if (!selectedRoles.length) return 'At least one role must be selected.'

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

    const baseInstitutionId =
      isInstitutionAdmin && myInstitutionId
        ? myInstitutionId
        : Number(institutionId.trim())

    const payload = {
      username: username.trim(),
      email: email.trim(),
      password: password.trim(),
      institutionId: baseInstitutionId,
      roles: selectedRoles,
      enabled
    }

    setCreating(true)
    try {
      const created = await createUser(payload)
      const shouldInclude =
        !isInstitutionAdmin || created.institutionId === myInstitutionId
      if (shouldInclude) {
        setUsers(prev => [created, ...prev])
      }
      setInfo(`User "${created.username}" created successfully.`)
      setUsername('')
      setEmail('')
      setPassword('')
      if (!isInstitutionAdmin) {
        setInstitutionId('')
      }
      setSelectedRoles(['ISSUER'])
      setEnabled(true)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to create user.'
      setError(msg)
    } finally {
      setCreating(false)
    }
  }

  const institutionsForSelect = institutions
  const roleOptionsForCurrentUser = isInstitutionAdmin
    ? roleOptions.filter(r => r.value !== 'SYSTEM_ADMIN')
    : roleOptions

  return (
    <DashboardLayout title="Users">
      <div className="space-y-5">
        <div className="text-xs text-slate-400">
          Manage platform users and their roles. System admins see all institutions,
          institution admins manage users for their own institution only.
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

        <div className="grid gap-4 md:grid-cols-[2fr,1.4fr]">
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80">
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-xs text-slate-400">
              <span>Users</span>
              {loading && <span className="text-[11px] text-slate-500">Loading…</span>}
            </div>
            <table className="min-w-full text-xs text-left text-slate-200">
              <thead className="border-b border-slate-800 bg-slate-900/90 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2">Username</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Institution</th>
                  <th className="px-3 py-2">Roles</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr
                    key={user.id}
                    className="border-t border-slate-800/80 hover:bg-slate-900"
                  >
                    <td className="px-3 py-2 text-xs text-slate-50">{user.username}</td>
                    <td className="px-3 py-2 text-[11px] text-slate-300">{user.email}</td>
                    <td className="px-3 py-2 text-[11px] text-slate-300">
                      {user.institutionName || '-'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map(role => (
                          <span
                            key={role}
                            className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-200"
                          >
                            {formatRoleLabel(role)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[11px]">
                      <span
                        className={
                          user.enabled
                            ? 'rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300 border border-emerald-500/40'
                            : 'rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700'
                        }
                      >
                        {user.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))}

                {!users.length && !loading && !error && (
                  <tr>
                    <td
                      className="px-3 py-4 text-center text-[11px] text-slate-500"
                      colSpan={5}
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
              Add new user
            </h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-200">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. issuer1"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-200">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. issuer1@institution.ac.zw"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-200">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Temporary password to share with user"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-200">Institution</label>
                {isInstitutionAdmin ? (
                  <input
                    type="text"
                    value={authUser?.institutionName ?? 'Not linked'}
                    disabled
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-400"
                  />
                ) : (
                  <select
                    value={institutionId}
                    onChange={e => setInstitutionId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-50 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
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
                <label className="text-slate-200">Roles</label>
                <div className="flex flex-wrap gap-2">
                  {roleOptionsForCurrentUser.map(opt => (
                    <label
                      key={opt.value}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-200"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(opt.value)}
                        onChange={() => toggleRole(opt.value)}
                        className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-2 text-[11px] text-slate-300">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={e => setEnabled(e.target.checked)}
                    className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                  />
                  <span>Enabled</span>
                </label>
              </div>
              <button
                type="submit"
                disabled={creating || (!institutionsForSelect.length && !isInstitutionAdmin)}
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-slate-50 shadow-md shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? 'Creating…' : 'Create user'}
              </button>
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
