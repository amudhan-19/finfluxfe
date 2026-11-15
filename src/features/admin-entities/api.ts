// @author  veera
// @file    features/admin-entities/api.ts

import api from '@/api/client'
import type { Entity } from '@/types/models'

export async function adminListEntities(): Promise<Entity[]> {
  const r = await api.get<Entity[]>('/api/admin/entities')
  return r.data
}

export interface CreateInput {
  id: string
  name: string
  region: 'North America' | 'Europe' | 'APAC'
  supervisor_id: number
  director_id?: number
  approval_level?: 'supervisor' | 'director'
  period_type?: 'YoY' | 'MoM' | 'QoQ' | 'Custom'
  period_from: string
  period_to: string
  sub_due_date?: string
  rev_due_date?: string
  currency?: string
  fiscal_year_end?: string
  tax_id?: string
  is_active?: boolean
  tags?: string[]
}

export async function adminCreateEntity(body: CreateInput): Promise<Entity> {
  const r = await api.post<Entity>('/api/admin/entities', body)
  return r.data
}

export interface UpdateInput {
  name?: string
  region?: 'North America' | 'Europe' | 'APAC'
  supervisor_id?: number
  director_id?: number | null
  approval_level?: 'supervisor' | 'director'
  period_type?: 'YoY' | 'MoM' | 'QoQ' | 'Custom'
  period_from?: string
  period_to?: string
  currency?: string
  fiscal_year_end?: string
  tax_id?: string
  is_active?: boolean
  tags?: string[]
}

export async function adminUpdateEntity(id: string, body: UpdateInput): Promise<Entity> {
  const r = await api.patch<Entity>(`/api/admin/entities/${id}`, body)
  return r.data
}

export async function adminDeleteEntity(id: string) {
  await api.delete(`/api/admin/entities/${id}`)
}

export interface SubledgerPartyOption {
  type: 'customer' | 'vendor'
  code: string
  name: string
  label: string
}

export interface SubledgerOptionsResponse {
  customers: SubledgerPartyOption[]
  vendors: SubledgerPartyOption[]
  message?: string | null
  warnings?: string[]
}

export async function getSubledgerOptions(
  entityId: string,
): Promise<SubledgerOptionsResponse> {
  const r = await api.get<SubledgerOptionsResponse>(
    `/api/admin/entities/${encodeURIComponent(entityId)}/subledger-options`,
  )
  return r.data
}
