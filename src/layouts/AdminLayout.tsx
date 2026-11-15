// @author  veera
// @file    layouts/AdminLayout.tsx

import { useEffect, useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import TopBar from '@/components/layout/TopBar'
import ToastHost from '@/components/shared/ToastHost'
import { AISupportFab } from '@/features/admin-support/components/AISupportFab'
import AdminLicenseSummary from '@/components/layout/AdminLicenseSummary'
import AdminNavTabs from '@/components/layout/AdminNavTabs'
import * as adminRbacApi from '@/features/admin-rbac/api'
import * as ontApi from '@/features/admin-ontology/api'
import { Users, Settings, Plug, Map, LifeBuoy } from 'lucide-react'

export default function AdminLayout() {
  const navigate = useNavigate()
  const loc = useLocation()

  const { data: lic } = useQuery({
    queryKey: ['admin-licenses'],
    queryFn: () => adminRbacApi.getLicenses(),
  })
  const { data: ontologyReadyIds = [] } = useQuery({
    queryKey: ['ontology-entities-ready'],
    queryFn: () => ontApi.getEntitiesReady(),
    refetchInterval: 60_000,
  })
  const ontologyReadyCount = ontologyReadyIds.length

  useEffect(() => {
    if (loc.pathname === '/admin' || loc.pathname === '/admin/') {
      navigate('/admin/users', { replace: true })
    }
  }, [loc.pathname, navigate])

  const navTabs = useMemo(() => [
    { to: '/admin/users', label: 'Users', icon: <Users size={15} strokeWidth={2} /> },
    { to: '/admin/config', label: 'Config', icon: <Settings size={15} strokeWidth={2} /> },
    { to: '/admin/integrations', label: 'Integrations', icon: <Plug size={15} strokeWidth={2} /> },
    {
      to: '/admin/ontology',
      label: 'Ontology Mapping',
      icon: <Map size={15} strokeWidth={2} />,
      badgeCount: ontologyReadyCount > 0 ? ontologyReadyCount : undefined,
    },
    { to: '/admin/support', label: 'Support', icon: <LifeBuoy size={15} strokeWidth={2} /> },
  ], [ontologyReadyCount])

  return (
    <div className="app-shell">
      <TopBar rightExtra={<AdminLicenseSummary lic={lic} />} />
      <AdminNavTabs tabs={navTabs} />
      <main className="app-page app-scroll">
        <Outlet />
      </main>
      <ToastHost />
      <AISupportFab />
    </div>
  )
}
