import React from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'

const LearnerDashboard: React.FC = () => {
  return (
    <DashboardLayout title="My credentials">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
        This is your learner dashboard. Soon we will show all credentials issued to you,
        with verification status and shareable links/QR codes.
      </div>
    </DashboardLayout>
  )
}

export default LearnerDashboard
