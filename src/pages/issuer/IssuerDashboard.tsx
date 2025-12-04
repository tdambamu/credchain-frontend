import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getLearners } from '../../api/learners'
import type { Learner } from '../../types/learner'

const IssuerDashboard: React.FC = () => {
  const { user } = useAuth()
  const [learnerCount, setLearnerCount] = useState<number | null>(null)
  const [recentLearners, setRecentLearners] = useState<Learner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.institutionId) return
      try {
        // Fetch learners (page 0, size 5 for recent list)
        // The backend PageResponse returns 'totalElements', which is our total count
        const data = await getLearners({
          institutionId: user.institutionId,
          page: 0,
          size: 5
        })
        setLearnerCount(data.totalElements)
        setRecentLearners(data.content)
      } catch (error) {
        console.error('Failed to load issuer stats', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user?.institutionId])

  return (
    <DashboardLayout title="Issuer overview">
      <div className="space-y-6">
        {/* Stats & Actions Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Stat Card: Total Learners */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs text-slate-400 uppercase tracking-wide">
              Learners Onboarded
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-50">
              {loading ? '...' : learnerCount ?? 0}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Registered in {user?.institutionName || 'your institution'}
            </div>
          </div>

          {/* Action Card: Quick Links */}
          <div className="col-span-1 md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-center">
            <div className="text-xs text-slate-400 uppercase tracking-wide mb-3">
              Quick Actions
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/issuer/issue"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500 transition"
              >
                + Issue New Credential
              </Link>
              <Link
                to="/issuer/credentials"
                className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
              >
                Manage Credentials
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Learners Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
            <h3 className="text-sm font-semibold text-slate-200">
              Recently Added Learners
            </h3>
            {/* Simple link to a theoretical learners page, or reusing credentials page for now */}
            <span className="text-[10px] text-slate-500">
              Showing recent 5
            </span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Loading data...
            </div>
          ) : recentLearners.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No learners found. Create learners via API or Admin console first.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/50 text-[10px] uppercase text-slate-500 font-medium">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Student No.</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {recentLearners.map(learner => (
                    <tr
                      key={learner.id}
                      className="hover:bg-slate-800/30 transition group"
                    >
                      <td className="px-4 py-2.5 font-medium text-slate-200">
                        {learner.firstName} {learner.lastName}
                      </td>
                      <td className="px-4 py-2.5">{learner.email}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">
                        {learner.studentNumber || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link
                          to={`/issuer/issue`} // In a real app, you might pre-select the learner via URL params
                          className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 hover:text-indigo-300 transition"
                        >
                          Issue Credential
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default IssuerDashboard