// @author  veera
// @file    config/appRoutes.tsx
//
// Single source of truth for protected route paths, allowed roles, and nav metadata.

import { lazy, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react'
import {
  Calendar,
  CheckCircle2,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  Map,
  Plug,
  ScrollText,
  Search,
  Settings,
  Users,
} from 'lucide-react'
import type { AppRole } from './roles'
import { APP_ROLES } from './roles'

export type RouteModuleId = 'analyst' | 'supervisor' | 'director' | 'admin'

type LazyComponent = LazyExoticComponent<ComponentType<object>>

export type AppRouteChildConfig = {
  id: string
  path: string
  allowedRoles: AppRole[]
  component: LazyComponent
  navLabel?: string
  navIcon?: ReactNode
  navTo?: string
  hiddenFromNav?: boolean
}

export type AppRouteGroupConfig = {
  id: RouteModuleId
  path: string
  allowedRoles: AppRole[]
  defaultChild: string
  layout: LazyComponent
  children: AppRouteChildConfig[]
}

const ADMIN_ROLES: AppRole[] = [APP_ROLES.ADMIN, APP_ROLES.SUPER_ADMIN]
const SUPERVISOR_ROLES: AppRole[] = [APP_ROLES.SUPERVISOR, APP_ROLES.DIRECTOR, APP_ROLES.SUPER_ADMIN]
const DIRECTOR_ROLES: AppRole[] = [APP_ROLES.DIRECTOR, APP_ROLES.SUPER_ADMIN]
const ANALYST_ROLES: AppRole[] = [APP_ROLES.ANALYST, APP_ROLES.SUPER_ADMIN]

const icon = (node: ReactNode) => node

const AnalystLayout = lazy(() => import('@/layouts/AnalystLayout'))
const SupervisorLayout = lazy(() => import('@/layouts/SupervisorLayout'))
const DirectorLayout = lazy(() => import('@/layouts/DirectorLayout'))
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'))

const AnalystDashboardPage = lazy(() => import('@/pages/analyst/DashboardPage'))
const AnalystFluxReviewPage = lazy(() => import('@/pages/analyst/FluxReviewPage'))
const AnalystFinCalendarPage = lazy(() => import('@/pages/analyst/FinCalendarPage'))
const AnalystSettingsPage = lazy(() => import('@/pages/analyst/SettingsPage'))

const SupDashboardPage = lazy(() => import('@/pages/supervisor/DashboardPage'))
const SupFluxReviewPage = lazy(() => import('@/pages/supervisor/FluxReviewPage'))
const SupFinCalendarPage = lazy(() => import('@/pages/supervisor/FinCalendarPage'))
const SupFluxSettingsPage = lazy(() => import('@/pages/supervisor/FluxSettingsPage'))

const DirectorQueuePage = lazy(() => import('@/pages/director/QueuePage'))

const UsersPage = lazy(() => import('@/pages/admin/UsersPage'))
const ConfigPage = lazy(() => import('@/pages/admin/ConfigPage'))
const IntegrationsPage = lazy(() => import('@/pages/admin/IntegrationsPage'))
const OntologyPage = lazy(() => import('@/pages/admin/OntologyPage'))
const SupportPage = lazy(() => import('@/pages/admin/SupportPage'))
const AuditLogPage = lazy(() => import('@/pages/admin/AuditLogPage'))

export const APP_ROUTE_GROUPS: AppRouteGroupConfig[] = [
  {
    id: 'analyst',
    path: '/analyst',
    allowedRoles: ANALYST_ROLES,
    defaultChild: 'dashboard',
    layout: AnalystLayout,
    children: [
      {
        id: 'analyst.dashboard',
        path: 'dashboard',
        component: AnalystDashboardPage,
        allowedRoles: ANALYST_ROLES,
        navLabel: 'Dashboard',
        navIcon: icon(<LayoutDashboard size={15} strokeWidth={2} />),
      },
      {
        id: 'analyst.fluxReview',
        path: 'flux-review',
        component: AnalystFluxReviewPage,
        allowedRoles: ANALYST_ROLES,
        navLabel: 'Flux Review',
        navIcon: icon(<LineChart size={15} strokeWidth={2} />),
      },
      {
        id: 'analyst.fluxReviewEntity',
        path: 'flux-review/:entityId',
        component: AnalystFluxReviewPage,
        allowedRoles: ANALYST_ROLES,
        hiddenFromNav: true,
      },
      {
        id: 'analyst.finCalendar',
        path: 'fincalendar',
        component: AnalystFinCalendarPage,
        allowedRoles: ANALYST_ROLES,
        navLabel: 'FinCalendar',
        navIcon: icon(<Calendar size={15} strokeWidth={2} />),
      },
      {
        id: 'analyst.settings',
        path: 'settings',
        component: AnalystSettingsPage,
        allowedRoles: ANALYST_ROLES,
        navLabel: 'Settings',
        navIcon: icon(<Settings size={15} strokeWidth={2} />),
      },
    ],
  },
  {
    id: 'supervisor',
    path: '/supervisor',
    allowedRoles: SUPERVISOR_ROLES,
    defaultChild: 'dashboard',
    layout: SupervisorLayout,
    children: [
      {
        id: 'supervisor.dashboard',
        path: 'dashboard',
        component: SupDashboardPage,
        allowedRoles: SUPERVISOR_ROLES,
        navLabel: 'Dashboard',
        navIcon: icon(<LayoutDashboard size={15} strokeWidth={2} />),
      },
      {
        id: 'supervisor.fluxReview',
        path: 'flux-review',
        component: SupFluxReviewPage,
        allowedRoles: SUPERVISOR_ROLES,
        navLabel: 'Flux Review',
        navIcon: icon(<Search size={15} strokeWidth={2} />),
      },
      {
        id: 'supervisor.fluxReviewEntity',
        path: 'flux-review/:entityId',
        component: SupFluxReviewPage,
        allowedRoles: SUPERVISOR_ROLES,
        hiddenFromNav: true,
      },
      {
        id: 'supervisor.finCalendar',
        path: 'fincalendar',
        component: SupFinCalendarPage,
        allowedRoles: SUPERVISOR_ROLES,
        navLabel: 'FinCalendar',
        navIcon: icon(<Calendar size={15} strokeWidth={2} />),
      },
      {
        id: 'supervisor.fluxSettings',
        path: 'flux-settings',
        component: SupFluxSettingsPage,
        allowedRoles: SUPERVISOR_ROLES,
        navLabel: 'Flux Settings',
        navIcon: icon(<Settings size={15} strokeWidth={2} />),
      },
    ],
  },
  {
    id: 'director',
    path: '/director',
    allowedRoles: DIRECTOR_ROLES,
    defaultChild: 'queue',
    layout: DirectorLayout,
    children: [
      {
        id: 'director.queue',
        path: 'queue',
        component: DirectorQueuePage,
        allowedRoles: DIRECTOR_ROLES,
        navLabel: 'Final Approval Queue',
        navIcon: icon(<CheckCircle2 size={15} strokeWidth={2} />),
      },
    ],
  },
  {
    id: 'admin',
    path: '/admin',
    allowedRoles: ADMIN_ROLES,
    defaultChild: 'users',
    layout: AdminLayout,
    children: [
      {
        id: 'admin.users',
        path: 'users',
        component: UsersPage,
        allowedRoles: ADMIN_ROLES,
        navLabel: 'Users',
        navTo: '/admin/users',
        navIcon: icon(<Users size={15} strokeWidth={2} />),
      },
      {
        id: 'admin.config',
        path: 'config',
        component: ConfigPage,
        allowedRoles: ADMIN_ROLES,
        navLabel: 'Config',
        navTo: '/admin/config',
        navIcon: icon(<Settings size={15} strokeWidth={2} />),
      },
      {
        id: 'admin.integrations',
        path: 'integrations',
        component: IntegrationsPage,
        allowedRoles: ADMIN_ROLES,
        navLabel: 'Integrations',
        navTo: '/admin/integrations',
        navIcon: icon(<Plug size={15} strokeWidth={2} />),
      },
      {
        id: 'admin.ontology',
        path: 'ontology',
        component: OntologyPage,
        allowedRoles: ADMIN_ROLES,
        navLabel: 'Ontology Mapping',
        navTo: '/admin/ontology',
        navIcon: icon(<Map size={15} strokeWidth={2} />),
      },
      {
        id: 'admin.support',
        path: 'support',
        component: SupportPage,
        allowedRoles: ADMIN_ROLES,
        navLabel: 'Support',
        navTo: '/admin/support',
        navIcon: icon(<LifeBuoy size={15} strokeWidth={2} />),
      },
      {
        id: 'admin.audit',
        path: 'audit',
        component: AuditLogPage,
        allowedRoles: ADMIN_ROLES,
        navLabel: 'Audit Logs',
        navTo: '/admin/audit',
        navIcon: icon(<ScrollText size={15} strokeWidth={2} />),
      },
    ],
  },
]

export type ResolvedRouteAccess = {
  id: string
  fullPath: string
  allowedRoles: AppRole[]
}

function joinPath(base: string, segment: string): string {
  return `${base.replace(/\/$/, '')}/${segment.replace(/^\//, '')}`
}

function flattenRoutes(): ResolvedRouteAccess[] {
  const out: ResolvedRouteAccess[] = []
  for (const group of APP_ROUTE_GROUPS) {
    out.push({ id: group.id, fullPath: group.path, allowedRoles: group.allowedRoles })
    for (const child of group.children) {
      out.push({
        id: child.id,
        fullPath: joinPath(group.path, child.path),
        allowedRoles: child.allowedRoles,
      })
    }
  }
  return out
}

const FLAT_ROUTES = flattenRoutes()

function matchRoutePattern(pattern: string, pathname: string): boolean {
  const patternParts = pattern.replace(/\/$/, '').split('/')
  const pathParts = pathname.replace(/\/$/, '').split('/')
  if (patternParts.length !== pathParts.length) return false
  return patternParts.every((part, i) => part.startsWith(':') || part === pathParts[i])
}

export function findRouteById(routeId: string): ResolvedRouteAccess | undefined {
  return FLAT_ROUTES.find((r) => r.id === routeId)
}

export function findRouteByPath(pathname: string): ResolvedRouteAccess | undefined {
  const path = pathname.split('?')[0].replace(/\/$/, '') || '/'
  const exact = FLAT_ROUTES.find((r) => r.fullPath.replace(/\/$/, '') === path)
  if (exact) return exact
  return FLAT_ROUTES.find((r) => matchRoutePattern(r.fullPath, path))
}
