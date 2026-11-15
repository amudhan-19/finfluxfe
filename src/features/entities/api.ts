// @author  veera
// @file    features/entities/api.ts

import api from '@/api/client'
import type { EntityListItem, EntityStatus } from '@/types/models'

export interface ListFilters {
  region?: string
  tag?: string
  status?: EntityStatus
}

export async function listEntities(f: ListFilters = {}): Promise<EntityListItem[]> {
  const r = await api.get<EntityListItem[]>('/api/entities', { params: f })
  return r.data
}

export async function getEntity(id: string): Promise<EntityListItem> {
  const r = await api.get<EntityListItem>(`/api/entities/${id}`)
  return r.data
}

export async function patchEntityStatus(id: string, status: EntityStatus, note?: string) {
  const r = await api.patch<EntityListItem>(`/api/entities/${id}/status`, { status, comment: note })
  return r.data
}
