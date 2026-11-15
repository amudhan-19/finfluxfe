// @author  veera
// @file    features/macro/api.ts

import api from '@/api/client'
import type { MacroFactor } from '@/types/models'

export async function getMacroFactors(entityId: string): Promise<MacroFactor[]> {
  const r = await api.get<MacroFactor[]>(`/api/entities/${entityId}/macro-factors`)
  return r.data
}

export async function addMacroFactor(entityId: string, body: { category: string; icon?: string; text: string }): Promise<MacroFactor> {
  const r = await api.post<MacroFactor>(`/api/entities/${entityId}/macro-factors`, body)
  return r.data
}

export async function editMacroFactor(entityId: string, id: number, text: string) {
  await api.patch(`/api/entities/${entityId}/macro-factors/${id}`, { text })
}

export async function deleteMacroFactor(entityId: string, id: number) {
  await api.delete(`/api/entities/${entityId}/macro-factors/${id}`)
}
