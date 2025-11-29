import React from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'

const AdminDashboard: React.FC = () => {
  return (
    <DashboardLayout title="Admin overview">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs text-slate-400">Institutions onboarded</div>
          <div className="mt-2 text-2xl font-semibold text-slate-50">0</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs text-slate-400">Active users</div>
          <div className="mt-2 text-2xl font-semibold text-slate-50">0</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs text-slate-400">Total verifications</div>
          <div className="mt-2 text-2xl font-semibold text-slate-50">0</div>
        </div>
      </div>
      <div className="mt-6 text-xs text-slate-500">
        We will connect these cards to MetricsController when we integrate metrics.
      </div>
    </DashboardLayout>
  )
}

export default AdminDashboard
