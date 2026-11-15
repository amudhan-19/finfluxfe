// @author  veera
// @file    layouts/SupervisorLayout.tsx

import { Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Search, Calendar, Settings } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import RoleNavTabs from '@/components/layout/RoleNavTabs'
import EntityTreeNav from '@/components/layout/EntityTreeNav'
import ToastHost from '@/components/shared/ToastHost'
import { AISupportFab } from '@/features/admin-support/components/AISupportFab'

const TABS = [
  { to: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} strokeWidth={2} /> },
  { to: 'flux-review', label: 'Flux Review', icon: <Search size={15} strokeWidth={2} /> },
  { to: 'fincalendar', label: 'FinCalendar', icon: <Calendar size={15} strokeWidth={2} /> },
  { to: 'flux-settings', label: 'Flux Settings', icon: <Settings size={15} strokeWidth={2} /> },
]

export default function SupervisorLayout() {
  const { pathname } = useLocation()
  const showEntityTree = pathname.includes('/flux-review')

  return (
    <div className="app-shell">
      <TopBar />
      <RoleNavTabs tabs={TABS} base="/supervisor" />
      <div className="app-content-row">
        {showEntityTree ? <EntityTreeNav basePath="/supervisor" /> : null}
        <div className="app-main">
          <Outlet />
        </div>
      </div>
      <ToastHost />
      <AISupportFab />
    </div>
  )
}
