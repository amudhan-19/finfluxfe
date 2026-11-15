// @author  veera
// @file    utils/rbac.ts

import type { Role } from '@/types/models'
import {
  homeRoute as configHomeRoute,
  normalizeRole,
  canAccessRoute,
  hasRole,
  getAllowedNavItems,
  resolveAuthDestination,
  APP_ROLES,
} from '@/config/rbac'
import type { AppRole } from '@/config/roles'

export {
  APP_ROLES,
  normalizeRole,
  hasRole,
  canAccessRoute,
  getAllowedNavItems,
  resolveAuthDestination,
}
export type { AppRole }

export const ROLE_LABELS: Record<Role, string> = {
  analyst: 'Analyst',
  supervisor: 'Supervisor',
  director: "Director (Supervisor's Boss)",
  admin: 'Admin',
}

export function homeRoute(role: Role | AppRole | string): string {
  return configHomeRoute(role)
}

export function canEditAi(role: Role): boolean {
  return role === 'supervisor' || role === 'admin'
}

export function canSignOff(role: Role): boolean {
  return role === 'supervisor' || role === 'director' || role === 'admin'
}

export function canManageTasks(role: Role): boolean {
  return role === 'supervisor' || role === 'admin'
}

export function canEditThresholds(role: Role): boolean {
  return role === 'supervisor' || role === 'admin'
}

export function canApproveDirector(role: Role): boolean {
  return role === 'director' || role === 'admin'
}

export function canSubmitFlux(role: Role): boolean {
  return role === 'analyst' || role === 'admin'
}

export function canGenerateAi(role: Role): boolean {
  return role === 'analyst' || role === 'supervisor' || role === 'admin'
}
