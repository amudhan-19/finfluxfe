// @author  veera
// @file    features/profile/api.ts

import api from '@/api/client'
import type { CompanyProfile, Threshold } from '@/types/models'

export async function getProfile(entityId: string): Promise<CompanyProfile> {
  const r = await api.get<CompanyProfile>(`/api/entities/${entityId}/profile`)
  return r.data
}

export async function putProfile(entityId: string, body: Partial<CompanyProfile>): Promise<CompanyProfile> {
  const r = await api.put<CompanyProfile>(`/api/entities/${entityId}/profile`, body)
  return r.data
}

export async function getThresholds(entityId: string): Promise<Threshold[]> {
  const r = await api.get<Threshold[]>(`/api/entities/${entityId}/thresholds`)
  return r.data
}

export async function putThresholds(entityId: string, body: Threshold) {
  const r = await api.put<Threshold>(`/api/entities/${entityId}/thresholds`, body)
  return r.data
}

export async function putPeriods(entityId: string, body: { period_type: string; period_from: string; period_to: string }) {
  const r = await api.put(`/api/entities/${entityId}/periods`, body)
  return r.data
}

export async function delegate(entityId: string, to_user_id: number, note?: string) {
  const r = await api.post(`/api/entities/${entityId}/delegate`, { to_user_id, note })
  return r.data
}
