// @author  veera
// @file    routes/router.tsx

import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'
import { homeRoute, normalizeRole } from '@/config/rbac'
import { buildProtectedRouteGroups } from './buildAppRoutes'
import { FullPageLoader } from './ProtectedRoute'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const AcceptInvitePage = lazy(() => import('@/pages/auth/AcceptInvitePage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<FullPageLoader />}>{children}</Suspense>
}

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />
  const role = normalizeRole(user.role)
  if (!role) return <Navigate to="/login" replace />
  return <Navigate to={homeRoute(role)} replace />
}

export const router = createBrowserRouter([
  { path: '/', element: <HomeRedirect /> },
  { path: '/login', element: <S><LoginPage /></S> },
  { path: '/accept-invite', element: <S><AcceptInvitePage /></S> },
  { path: '/forgot-password', element: <S><ForgotPasswordPage /></S> },
  { path: '/reset-password', element: <S><ResetPasswordPage /></S> },

  ...buildProtectedRouteGroups(),

  { path: '*', element: <HomeRedirect /> },
])
