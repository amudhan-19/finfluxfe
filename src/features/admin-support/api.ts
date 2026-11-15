// @author  veera
// @file    features/admin-support/api.ts

import api from '@/api/client'
import type { AiChatResponse, SupportChannel, SupportTicketCreate, SupportTicketResponse } from '@/features/admin-support/types'

export async function getSupportChannels(): Promise<SupportChannel[]> {
  const r = await api.get<SupportChannel[]>('/api/admin/support/channels')
  return r.data
}

export async function createSupportTicket(body: SupportTicketCreate): Promise<SupportTicketResponse> {
  const r = await api.post<SupportTicketResponse>('/api/admin/support/tickets', body)
  return r.data
}

export async function postAiSupportChat(message: string): Promise<AiChatResponse> {
  const r = await api.post<AiChatResponse>('/api/admin/support/ai-chat', { message })
  return r.data
}
