// @author  veera
// @file    features/chat/api.ts

import api from '@/api/client'
import type { ChatMessage } from '@/types/models'

export async function getChat(entityId: string): Promise<ChatMessage[]> {
  const r = await api.get<ChatMessage[]>(`/api/entities/${entityId}/chat`)
  return r.data
}

export async function postMessage(entityId: string, text: string): Promise<ChatMessage> {
  const r = await api.post<ChatMessage>(`/api/entities/${entityId}/chat`, { text })
  return r.data
}

export async function replyMessage(entityId: string, messageId: number, text: string): Promise<ChatMessage> {
  const r = await api.post<ChatMessage>(`/api/entities/${entityId}/chat/${messageId}/reply`, { text })
  return r.data
}

export async function flagMessage(entityId: string, messageId: number) {
  const r = await api.patch(`/api/entities/${entityId}/chat/${messageId}/flag`)
  return r.data
}

export async function forwardMessage(entityId: string, messageId: number, to_user_id: number) {
  const r = await api.post(`/api/entities/${entityId}/chat/${messageId}/forward`, null, { params: { to_user_id } })
  return r.data
}
