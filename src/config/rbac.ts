// @author  veera
// @file    config/rbac.ts
//
// Centralized frontend RBAC — role normalization, route access, and navigation filtering.

import type { ReactNode } from 'react'
import { APP_ROUTE_GROUPS, findRouteById, findRouteByPath, type RouteModuleId } from './appRoutes'
import { APP_ROLES, type AppRole } from './roles'

export { APP_ROLES, type AppRole, type RouteAccessConfig } from './roles'

export type NavItem = {
  routeId: string
  to: string
  label: string
  icon?: ReactNode
}

const ROLE_ALIASES: Record<string, AppRole> = {
  super_admin: APP_ROLES.SUPER_ADMIN,
  superadmin: APP_ROLES.SUPER_ADMIN,
  superadministrator: APP_ROLES.SUPER_ADMIN,
  administrator: APP_ROLES.ADMIN,
  admin: APP_ROLES.ADMIN,
  supervisor: APP_ROLES.SUPERVISOR,
  analyst: APP_ROLES.ANALYST,
  analyste: APP_ROLES.ANALYST,
  director: APP_ROLES.DIRECTOR,
}

export function normalizeRole(role: unknown): AppRole | null {
  if (role == null) return null
  const raw = String(role).trim().toLowerCase()
  if (!raw) return null

  const compact = raw.replace(/[\s_-]+/g, '')
  if (compact === 'superadmin' || compact === 'superadministrator') {
    return APP_ROLES.SUPER_ADMIN
  }

  const underscored = raw.replace(/[\s-]+/g, '_')
  if (ROLE_ALIASES[underscored]) return ROLE_ALIASES[underscored]
  if (ROLE_ALIASES[compact]) return ROLE_ALIASES[compact]

  return null
}

export function hasRole(userRole: unknown, allowedRoles: AppRole[]): boolean {
  const normalized = normalizeRole(userRole)
  if (!normalized) return false
  return allowedRoles.includes(normalized)
}

export function homeRoute(role: unknown): string {
  const normalized = normalizeRole(role)
  if (!normalized) return '/login'

  switch (normalized) {
    case APP_ROLES.SUPER_ADMIN:
    case APP_ROLES.ADMIN:
      return '/admin/users'
    case APP_ROLES.SUPERVISOR:
      return '/supervisor/dashboard'
    case APP_ROLES.DIRECTOR:
      return '/director/queue'
    case APP_ROLES.ANALYST:
      return '/analyst/dashboard'
    default:
      return '/login'
  }
}

export function canAccessRoute(userRole: unknown, routeIdOrPath: string): boolean {
  const normalized = normalizeRole(userRole)
  if (!normalized) return false

  const trimmed = routeIdOrPath.trim()
  const route = trimmed.startsWith('/')
    ? findRouteByPath(trimmed)
    : findRouteById(trimmed)

  if (!route) return false
  return route.allowedRoles.includes(normalized)
}

export function resolveAuthDestination(role: unknown, from?: string): string {
  if (from && canAccessRoute(role, from)) return from
  return homeRoute(role)
}

export function getAllowedNavItems(userRole: unknown, moduleId: RouteModuleId): NavItem[] {
  const normalized = normalizeRole(userRole)
  if (!normalized) return []

  const group = APP_ROUTE_GROUPS.find((g) => g.id === moduleId)
  if (!group) return []

  return group.children
    .filter((child) => !child.hiddenFromNav && child.navLabel && child.allowedRoles.includes(normalized))
    .map((child) => ({
      routeId: child.id,
      to: child.navTo ?? child.path.split('/:')[0],
      label: child.navLabel!,
      icon: child.navIcon,
    }))
}
