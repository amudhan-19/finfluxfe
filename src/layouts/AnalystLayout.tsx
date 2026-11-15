// @author  veera
// @file    layouts/AnalystLayout.tsx

import { Outlet } from 'react-router-dom'
import { LayoutDashboard, LineChart, Calendar, Settings } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import RoleNavTabs from '@/components/layout/RoleNavTabs'
import EntityTreeNav from '@/components/layout/EntityTreeNav'
import ToastHost from '@/components/shared/ToastHost'
import FinTalk from '@/components/shared/FinTalk'
import { AISupportFab } from '@/features/admin-support/components/AISupportFab'

const TABS = [
  { to: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} strokeWidth={2} /> },
  { to: 'flux-review', label: 'Flux Review', icon: <LineChart size={15} strokeWidth={2} /> },
  { to: 'fincalendar', label: 'FinCalendar', icon: <Calendar size={15} strokeWidth={2} /> },
  { to: 'settings', label: 'Settings', icon: <Settings size={15} strokeWidth={2} /> },
]

export default function AnalystLayout() {
  return (
    <div className="app-shell app-shell--with-fintalk">
      <TopBar />
      <RoleNavTabs tabs={TABS} base="/analyst" />
      <div className="app-content-row">
        <EntityTreeNav basePath="/analyst" />
        <div className="app-main">
          <Outlet />
        </div>
      </div>
      <ToastHost />
      <FinTalk />
      <AISupportFab />
    </div>
  )
}
