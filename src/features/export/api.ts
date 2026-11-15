// @author  veera
// @file    features/export/api.ts

import api from '@/api/client'

export async function exportEntity(
  entityId: string,
  body: { mode: 'concise' | 'detailed'; statement: 'pl' | 'bs' | 'both' },
) {
  const r = await api.post(`/api/entities/${entityId}/export`, body)
  return r.data
}
