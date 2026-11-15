// @author  veera
// @file    routes/buildAppRoutes.tsx

import { Suspense, type ComponentType, type ReactNode } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'
import { APP_ROUTE_GROUPS } from '@/config/appRoutes'
import type { AppRole } from '@/config/roles'
import ProtectedRoute, { FullPageLoader } from './ProtectedRoute'
import RoleGuard from './RoleGuard'

function withSuspense(Component: ComponentType<object>): ReactNode {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Component />
    </Suspense>
  )
}

function protectedLayout(allowedRoles: AppRole[], Layout: ComponentType<object>): ReactNode {
  return (
    <ProtectedRoute>
      <RoleGuard allow={allowedRoles}>
        {withSuspense(Layout)}
      </RoleGuard>
    </ProtectedRoute>
  )
}

export function buildProtectedRouteGroups(): RouteObject[] {
  return APP_ROUTE_GROUPS.map((group) => ({
    path: group.path,
    element: protectedLayout(group.allowedRoles, group.layout),
    children: [
      { index: true, element: <Navigate to={group.defaultChild} replace /> },
      ...group.children.map((child) => ({
        path: child.path,
        element: withSuspense(child.component),
      })),
    ],
  }))
}
