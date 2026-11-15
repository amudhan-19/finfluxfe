// @author  veera
// @file    features/admin-users/api.ts

import api from '@/api/client'
import type { AdminUser, LicenseInfo, Role, UserStatus } from '@/types/models'

/**
 * Licence seats for the Admin Users page.
 * Product docs sometimes say `GET /api/admin/licenses`; the backend exposes this
 * at `GET /api/admin/rbac/licenses`.
 */
export async function getAdminLicenses(): Promise<LicenseInfo> {
  const r = await api.get<LicenseInfo>('/api/admin/rbac/licenses')
  return r.data
}

export async function listUsers(): Promise<AdminUser[]> {
  const r = await api.get<AdminUser[]>('/api/admin/users')
  return r.data
}

export interface InviteInput {
  email: string
  first_name: string
  last_name: string
  role: Role
  department?: string
  supervisor_user_id?: number
  entity_ids?: string[]
}

export type EmailDeliveryStatus = 'accepted' | 'failed'

export interface InviteUserResponse extends AdminUser {
  user_created: boolean
  invite_created: boolean
  email_sent: boolean
  email_status: EmailDeliveryStatus
  safe_error_code?: string | null
  message?: string | null
}

export async function inviteUser(body: InviteInput): Promise<InviteUserResponse> {
  const r = await api.post<InviteUserResponse>('/api/admin/users/invite', body)
  return r.data
}

export interface UpdateInput {
  first_name?: string
  last_name?: string
  email?: string
  role?: Role
  status?: UserStatus
  department?: string
  supervisor_user_id?: number
  entity_ids?: string[]
}

export async function updateUser(id: number, body: UpdateInput): Promise<AdminUser> {
  const r = await api.patch<AdminUser>(`/api/admin/users/${id}`, body)
  return r.data
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/api/admin/users/${id}`)
}

export async function bulkRole(user_ids: number[], role: Role) {
  const r = await api.post('/api/admin/users/bulk-role', { user_ids, role })
  return r.data as { updated: number }
}

export async function exportCsvUrl(): Promise<string> {
  return '/api/admin/users/export.csv'
}

export interface ResendInviteResponse {
  ok: boolean
  email_sent: boolean
  email_status: EmailDeliveryStatus
  safe_error_code?: string | null
  message?: string | null
}

export async function resendInvite(id: number): Promise<ResendInviteResponse> {
  const r = await api.post<ResendInviteResponse>(`/api/admin/users/${id}/resend-invite`)
  return r.data
}
