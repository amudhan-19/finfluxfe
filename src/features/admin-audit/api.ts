// @author  veera
// @file    features/admin-audit/api.ts

import api from '@/api/client'
import type { AuditLogRow } from '@/types/models'

export interface AuditFilters {
  actor?: number
  action?: string
  table?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

export async function listAudit(f: AuditFilters = {}): Promise<AuditLogRow[]> {
  const r = await api.get<AuditLogRow[]>('/api/admin/audit-logs', { params: f })
  return r.data
}
