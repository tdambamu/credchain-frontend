import React from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'

const StatCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-4 flex flex-col justify-between">
    <div className="text-xs text-slate-400">{label}</div>
    <div className="mt-3 text-3xl font-semibold text-slate-50">{value}</div>
  </div>
)

const AdminDashboard: React.FC = () => {
  return (
    <DashboardLayout title="Admin overview">
      <div className="space-y-6">
        <div className="text-xs text-slate-400">
          Demo Higher Education Institution
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Institutions onboarded" value={0} />
          <StatCard label="Active users" value={0} />
          <StatCard label="Total verifications" value={0} />
        </div>

        <p className="text-xs text-slate-500">
          We will connect these cards to MetricsController when we integrate metrics.
        </p>
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard
