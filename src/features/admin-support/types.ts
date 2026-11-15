// @author  veera
// @file    features/admin-support/types.ts

export type SupportPriority = 'low' | 'medium' | 'high' | 'critical'

export interface SupportChannel {
  id: string
  label: string
  value: string
  description: string
  color: string
  bg: string
}

export interface SupportTicketCreate {
  subject: string
  description: string
  priority: SupportPriority
}

export interface SupportTicketResponse {
  id: number
  reference: string
  message: string
}

export interface AiChatResponse {
  reply: string
}
