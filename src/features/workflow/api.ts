// @author  veera
// @file    features/workflow/api.ts

import api from '@/api/client'

export async function submitEntity(id: string, note?: string) {
  const r = await api.post(`/api/entities/${id}/submit`, { note })
  return r.data
}
export async function approveEntity(id: string, note?: string) {
  const r = await api.post(`/api/entities/${id}/approve`, { note })
  return r.data
}
export async function rejectEntity(id: string, note?: string) {
  const r = await api.post(`/api/entities/${id}/reject`, { note })
  return r.data
}
export async function sendForApproval(id: string, note?: string) {
  const r = await api.post(`/api/entities/${id}/send-for-approval`, { note })
  return r.data
}
export async function directorQueue() {
  const r = await api.get('/api/entities/director/queue')
  return r.data as Array<{ id: string; name: string; region: string; status: string }>
}
