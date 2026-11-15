// @author  veera
// @file    features/comments/api.ts

import api from '@/api/client'
import type { Comment } from '@/types/models'

export async function getComments(entityId: string, caption: string): Promise<Comment[]> {
  const r = await api.get<Comment[]>(`/api/entities/${entityId}/comments`, {
    params: { caption },
  })
  return r.data
}

export async function addComment(entityId: string, caption: string, text: string, parent_id?: number): Promise<Comment> {
  const r = await api.post<Comment>(
    `/api/entities/${entityId}/comments`,
    { text, parent_id },
    { params: { caption } },
  )
  return r.data
}

export async function resolveComment(entityId: string, commentId: number): Promise<void> {
  await api.patch(`/api/entities/${entityId}/comments/${commentId}/resolve`)
}
