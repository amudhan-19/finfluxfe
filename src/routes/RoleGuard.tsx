// @author  veera
// @file    routes/RoleGuard.tsx

import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'
import { homeRoute, hasRole, normalizeRole } from '@/config/rbac'
import type { AppRole } from '@/config/roles'
import type { ReactNode } from 'react'
import { FullPageLoader } from './ProtectedRoute'

export default function RoleGuard({
  allow,
  children,
}: {
  allow: AppRole[]
  children: ReactNode
}) {
  const { user, loading } = useAuth()

  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />

  const role = normalizeRole(user.role)
  if (!role) return <Navigate to="/login" replace />
  if (!hasRole(role, allow)) return <Navigate to={homeRoute(role)} replace />

  return <>{children}</>
}
