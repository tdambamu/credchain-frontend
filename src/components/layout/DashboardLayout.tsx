import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { Role } from '../../types/auth'

type NavItem = {
  label: string
  to: string
}

type DashboardLayoutProps = {
  title: string
  children: React.ReactNode
}

const getNavItemsForRole = (role: Role): NavItem[] => {
  if (role === 'ADMIN') {
    return [
      { label: 'Overview', to: '/admin' },
      { label: 'Institutions', to: '/admin/institutions' },
      { label: 'Users', to: '/admin/users' },
      { label: 'Metrics', to: '/admin/metrics' }
    ]
  }

  if (role === 'ISSUER') {
    return [
      { label: 'Overview', to: '/issuer' },
      { label: 'Credentials', to: '/issuer/credentials' },
      { label: 'Issue credential', to: '/issuer/issue' }
    ]
  }

  if (role === 'LEARNER') {
    return [
      { label: 'My credentials', to: '/learner' }
    ]
  }

  return [{ label: 'Verify', to: '/verify' }]
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ title, children }) => {
  const { user, logout } = useAuth()
  const role = user?.appRole ?? 'UNKNOWN'
  const navItems = getNavItemsForRole(role)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex">
      <aside className="hidden md:flex w-60 flex-col border-r border-slate-800 bg-slate-950/95">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-800/80">
          <div className="h-8 w-8 rounded-2xl bg-linear-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-slate-950">
            CC
          </div>
          <div>
            <div className="text-sm font-semibold">CredChain</div>
            <div className="text-[11px] text-slate-400">Credential console</div>
          </div>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1 text-sm">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2 rounded-lg px-3 py-2 transition',
                  isActive
                    ? 'bg-slate-800 text-slate-50'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                ].join(' ')
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 px-4 py-3 text-xs text-slate-400 space-y-1">
          <div className="font-medium text-slate-200">{user?.username}</div>
          {user?.institutionName && (
            <div className="truncate text-[11px] text-slate-400">
              {user.institutionName}
            </div>
          )}
          <div className="flex items-center justify-between pt-2">
            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
              {role.toLowerCase()}
            </span>
            <button
              onClick={logout}
              className="text-[11px] text-slate-400 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur">
          <div>
            <h1 className="text-base font-semibold text-slate-50">{title}</h1>
            {user?.institutionName && (
              <p className="text-[11px] text-slate-400">
                {user.institutionName}
              </p>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
