// @author  veera
// @file    features/admin-rbac/api.ts

import api from '@/api/client'
import type { LicenseInfo, PermissionRow, Role, RoleRow } from '@/types/models'

export async function getRoles(): Promise<RoleRow[]> {
  const r = await api.get<RoleRow[]>('/api/admin/rbac/roles')
  return r.data
}

export async function getPermissions(): Promise<PermissionRow[]> {
  const r = await api.get<PermissionRow[]>('/api/admin/rbac/permissions')
  return r.data
}

export async function getRolePermissions(): Promise<Record<Role, string[]>> {
  const r = await api.get<Record<Role, string[]>>('/api/admin/rbac/role-permissions')
  return r.data
}

export async function setRolePermissions(role_key: Role, permission_keys: string[]) {
  await api.put('/api/admin/rbac/role-permissions', { role_key, permission_keys })
}

export async function getModuleAccess(): Promise<Record<Role, string[]>> {
  const r = await api.get<Record<Role, string[]>>('/api/admin/rbac/module-access')
  return r.data
}

export async function setModuleAccess(role_key: Role, modules: string[]) {
  await api.put('/api/admin/rbac/module-access', { role_key, modules })
}

export async function getLicenses(): Promise<LicenseInfo> {
  const r = await api.get<LicenseInfo>('/api/admin/rbac/licenses')
  return r.data
}
