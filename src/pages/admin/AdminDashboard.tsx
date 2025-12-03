import React, { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { getInstitutions } from '../../api/institutions'
import { getUsersPage } from '../../api/users'
import { getVerificationSummary, getVerificationLogs } from '../../api/metrics'
import type { VerificationMetrics, VerificationLog } from '../../types/metrics'

const StatCard: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-4">
    <div className="text-[11px] text-slate-400 uppercase">{label}</div>
    <div className="mt-3 text-3xl font-semibold text-slate-50">{value}</div>
  </div>
)

const AdminDashboard: React.FC = () => {
  const [institutionCount, setInstitutionCount] = useState(0)
  const [userCount, setUserCount] = useState(0)
  const [metrics, setMetrics] = useState<VerificationMetrics | null>(null)
  const [logs, setLogs] = useState<VerificationLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const [institutions, usersPage, metricsResponse, logsPage] = await Promise.all([
          getInstitutions(),
          getUsersPage({ page: 0, size: 1 }),
          getVerificationSummary(),
          getVerificationLogs({ page: 0, size: 100 })
        ])

        setInstitutionCount(institutions.length)
        setUserCount(usersPage.totalElements)
        setMetrics(metricsResponse)
        setLogs(logsPage.content ?? [])
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Failed to load admin dashboard data.'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const breakdown = useMemo(() => {
    if (!metrics || !metrics.totalCount) return []
    const total = metrics.totalCount
    const entries = [
      { label: 'Valid', value: metrics.validCount },
      { label: 'Revoked', value: metrics.revokedCount },
      { label: 'Expired', value: metrics.expiredCount },
      { label: 'Invalid', value: metrics.invalidCount },
      { label: 'Not found', value: metrics.notFoundCount }
    ]
    return entries.map(e => ({
      ...e,
      percent: total ? Number(((e.value / total) * 100).toFixed(1)) : 0
    }))
  }, [metrics])

  const perDay = useMemo(() => {
    if (!logs.length) return { points: [] as { day: string; count: number }[], max: 0 }
    const map = new Map<string, number>()
    logs.forEach(log => {
      if (!log.verifiedAt) return
      const d = new Date(log.verifiedAt)
      if (Number.isNaN(d.getTime())) return
      const key = d.toISOString().slice(0, 10)
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    const entries = Array.from(map.entries())
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => (a.day < b.day ? -1 : 1))
      .slice(-14)
    const max = entries.reduce((m, e) => (e.count > m ? e.count : m), 0) || 1
    return { points: entries, max }
  }, [logs])

  return (
    <DashboardLayout title="System overview">
      <div className="space-y-5 text-xs text-slate-300">
        {error && (
          <div className="rounded-lg border border-red-500/60 bg-red-950/40 px-3 py-2 text-xs text-red-100">
            {error}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-4">
          <StatCard label="Institutions onboarded" value={institutionCount} />
          <StatCard label="Users registered" value={userCount} />
          <StatCard label="Total verifications" value={metrics?.totalCount ?? 0} />
          <StatCard
            label="Average verification latency (ms)"
            value={metrics?.avgLatencyMs != null ? Math.round(metrics.avgLatencyMs) : '—'}
          />
        </div>

        {loading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-300">
            Loading verification insights…
          </div>
        )}

        {!loading && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-sm font-semibold text-slate-50">
                Verification result breakdown
              </div>
              {!metrics || metrics.totalCount === 0 ? (
                <div className="mt-4 text-[11px] text-slate-500">
                  No verification logs have been recorded yet. Once verifications start flowing,
                  this section will surface patterns and performance.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {breakdown.map(item => (
                    <div key={item.label} className="space-y-1 text-[11px] text-slate-300">
                      <div className="flex items-center justify-between">
                        <span>{item.label}</span>
                        <span>
                          {item.value} ({item.percent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={
                            'h-2 rounded-full ' +
                            (item.label === 'Valid'
                              ? 'bg-emerald-500'
                              : item.label === 'Revoked'
                              ? 'bg-red-500'
                              : item.label === 'Expired'
                              ? 'bg-amber-500'
                              : 'bg-sky-500')
                          }
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="text-sm font-semibold text-slate-50">
                Verifications per day (last 14 days)
              </div>
              {!perDay.points.length ? (
                <div className="mt-4 text-[11px] text-slate-500">
                  No verification activity yet. This chart will show daily verification volumes.
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {perDay.points.map(p => {
                    const width = (p.count / perDay.max) * 100
                    return (
                      <div key={p.day} className="flex items-center gap-2 text-[11px]">
                        <span className="w-24 text-slate-400">{p.day}</span>
                        <div className="h-2 flex-1 rounded-full bg-slate-800">
                          <div
                            className="h-2 rounded-full bg-indigo-500"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <span className="w-6 text-right text-slate-200">{p.count}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-50">
                Recent verification logs
              </div>
              <a
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/metrics/verification-logs/export`}
                className="text-[11px] text-indigo-300 hover:text-indigo-200"
              >
                Download CSV
              </a>
            </div>
            {!logs.length ? (
              <div className="mt-3 text-[11px] text-slate-500">
                No verification logs captured yet.
              </div>
            ) : (
              <div className="mt-3 max-h-80 overflow-auto rounded-lg border border-slate-800">
                <table className="min-w-full text-left text-[11px] text-slate-200">
                  <thead className="sticky top-0 bg-slate-900/95 text-[10px] uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">Credential ID</th>
                      <th className="px-3 py-2">Result</th>
                      <th className="px-3 py-2">Latency</th>
                      <th className="px-3 py-2">Client IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr
                        key={log.id}
                        className="border-t border-slate-800/80 hover:bg-slate-900"
                      >
                        <td className="px-3 py-2 text-slate-300">
                          {log.verifiedAt
                            ? new Date(log.verifiedAt).toLocaleString()
                            : '-'}
                        </td>
                        <td className="px-3 py-2 font-mono text-[10px] text-slate-100">
                          {log.publicId}
                        </td>
                        <td className="px-3 py-2 text-slate-300">
                          {log.resultStatus}
                        </td>
                        <td className="px-3 py-2 text-slate-300">
                          {log.latencyMs} ms
                        </td>
                        <td className="px-3 py-2 text-slate-300">
                          {log.clientIp || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard

