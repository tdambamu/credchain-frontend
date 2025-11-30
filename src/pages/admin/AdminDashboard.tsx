import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { getInstitutions } from '../../api/institutions'
import { getUsersPage } from '../../api/users'
import { getVerificationSummary } from '../../api/metrics'
import type { VerificationMetrics } from '../../types/metrics'

const StatCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-4 flex flex-col justify-between">
    <div className="text-xs text-slate-400">{label}</div>
    <div className="mt-3 text-3xl font-semibold text-slate-50">{value}</div>
  </div>
)

const AdminDashboard: React.FC = () => {
  const [institutionCount, setInstitutionCount] = useState(0)
  const [activeUsers, setActiveUsers] = useState(0)
  const [totalVerifications, setTotalVerifications] = useState(0)
  const [metrics, setMetrics] = useState<VerificationMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [institutionsRes, usersPage, summary] = await Promise.all([
          getInstitutions(),
          getUsersPage({ page: 0, size: 1 }),
          getVerificationSummary()
        ])

        setInstitutionCount(institutionsRes.length)
        const totalUsers =
          typeof usersPage.totalElements === 'number'
            ? usersPage.totalElements
            : usersPage.content.length
        setActiveUsers(totalUsers)
        setTotalVerifications(summary.totalCount)
        setMetrics(summary)
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Failed to load admin overview metrics.'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const validRate =
    metrics && metrics.totalCount > 0
      ? Math.round((metrics.validCount / metrics.totalCount) * 100)
      : 0
  const revokedRate =
    metrics && metrics.totalCount > 0
      ? Math.round((metrics.revokedCount / metrics.totalCount) * 100)
      : 0
  const invalidRate =
    metrics && metrics.totalCount > 0
      ? Math.round((metrics.invalidCount / metrics.totalCount) * 100)
      : 0

  return (
    <DashboardLayout title="Admin overview">
      <div className="space-y-6">
        <div className="text-xs text-slate-400">
          Demo Higher Education Institution
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/60 bg-red-950/40 px-3 py-2 text-xs text-red-100">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>
            High-level snapshot of institutions, users and verification activity.
          </span>
          {loading && <span>Loading…</span>}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Institutions onboarded" value={institutionCount} />
          <StatCard label="Active users" value={activeUsers} />
          <StatCard label="Total verifications" value={totalVerifications} />
        </div>

        <p className="text-xs text-slate-500">
          Verification metrics come from MetricsController. Below is a simple
          summary based on the latest verification logs.
        </p>

        {metrics && metrics.totalCount > 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs space-y-2">
            <div className="text-slate-200 font-semibold text-sm">
              Verification insights
            </div>
            <ul className="list-disc pl-4 space-y-1 text-slate-300">
              <li>
                {metrics.totalCount} verification checks recorded, with about {validRate}% reporting valid credentials.
              </li>
              <li>
                Approximately {revokedRate}% of checks involve revoked credentials, and about {invalidRate}% are invalid or not found.
              </li>
              <li>
                Average verification latency is{' '}
                {metrics.avgLatencyMs != null
                  ? `${Math.round(metrics.avgLatencyMs)} ms`
                  : 'not yet available'}
                , based on current logs.
              </li>
            </ul>
          </div>
        )}

        {metrics && metrics.totalCount === 0 && !loading && !error && (
          <p className="text-xs text-slate-500">
            No verification logs have been recorded yet. Once verifications start
            flowing in, this section will surface patterns and performance.
          </p>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard
