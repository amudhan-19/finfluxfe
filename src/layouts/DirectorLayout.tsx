// @author  veera
// @file    layouts/DirectorLayout.tsx

import { useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import TopBar from '@/components/layout/TopBar'
import RoleNavTabs from '@/components/layout/RoleNavTabs'
import ToastHost from '@/components/shared/ToastHost'
import { AISupportFab } from '@/features/admin-support/components/AISupportFab'
import { useAuth } from '@/features/auth/AuthProvider'
import { getAllowedNavItems } from '@/config/rbac'

export default function DirectorLayout() {
  const { user } = useAuth()
  const tabs = useMemo(
    () => getAllowedNavItems(user?.role, 'director').map((item) => ({
      to: item.to,
      label: item.label,
      icon: item.icon,
    })),
    [user?.role],
  )

  return (
    <div className="app-shell">
      <TopBar />
      <RoleNavTabs tabs={tabs} base="/director" />
      <main className="app-page app-scroll">
        <Outlet />
      </main>
      <ToastHost />
      <AISupportFab />
    </div>
  )
}
