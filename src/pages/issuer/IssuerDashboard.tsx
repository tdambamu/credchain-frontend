import React from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'

const IssuerDashboard: React.FC = () => {
  return (
    <DashboardLayout title="Issuer overview">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs text-slate-400">Total credentials issued</div>
          <div className="mt-2 text-2xl font-semibold text-slate-50">0</div>
          <div className="mt-1 text-[11px] text-slate-500">We will pull this from MetricsController later.</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs text-slate-400">Active credentials</div>
          <div className="mt-2 text-2xl font-semibold text-slate-50">0</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs text-slate-400">Revoked credentials</div>
          <div className="mt-2 text-2xl font-semibold text-slate-50">0</div>
        </div>
      </div>
      <div className="mt-6 text-xs text-slate-500">
        Next: we will add a table of recent credentials issued by this institution and a shortcut to issue a new one.
      </div>
    </DashboardLayout>
  )
}

export default IssuerDashboard
