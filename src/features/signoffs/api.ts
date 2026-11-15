// @author  veera
// @file    features/signoffs/api.ts

import api from '@/api/client'
import type { Signoff } from '@/types/models'

export async function getSignoffs(entityId: string): Promise<Signoff[]> {
  const r = await api.get<Signoff[]>(`/api/entities/${entityId}/signoffs`)
  return r.data
}

export async function signCaption(entityId: string, caption: string): Promise<Signoff> {
  const r = await api.post<Signoff>(`/api/entities/${entityId}/signoff/${encodeURIComponent(caption)}`)
  return r.data
}

export async function clearSignoff(entityId: string, caption: string): Promise<void> {
  await api.delete(`/api/entities/${entityId}/signoff/${encodeURIComponent(caption)}`)
}

export async function bulkSignoff(entityId: string, statement: 'pl' | 'bs') {
  const r = await api.post(`/api/entities/${entityId}/signoff/bulk`, { statement })
  return r.data as { signed: string[]; count: number }
}
