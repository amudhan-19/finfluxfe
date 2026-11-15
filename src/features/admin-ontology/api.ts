// @author  veera
// @file    features/admin-ontology/api.ts
//
// Mounted at `/api/admin/ontology/*` (product docs may use `/api/admin/entities/:code/ontology`).

import api from '@/api/client'
import type { CustomCaption, OntologyMapping } from '@/types/models'

export type OntologyDisplayColumn = 'tflux' | 'erp' | 'custom'

export async function getEntitiesReady(): Promise<string[]> {
  const r = await api.get<string[]>('/api/admin/ontology/entities-ready')
  return r.data
}

export async function getMapping(entityId: string, statement: 'pl' | 'bs'): Promise<OntologyMapping[]> {
  const r = await api.get<OntologyMapping[]>(`/api/admin/ontology/${entityId}`, { params: { statement } })
  return r.data
}

export async function upsertMapping(entityId: string, body: {
  statement: 'pl' | 'bs'
  tflux_caption: string
  erp_gl_json?: string[]
  erp_subgl_json?: string[]
  erp_subledger_json?: Array<string | { type?: string; code?: string; name?: string; label?: string }>
  custom_caption?: string | null
  is_hidden?: boolean
  display_column?: 'tflux' | 'erp' | 'custom'
}): Promise<OntologyMapping> {
  const r = await api.put<OntologyMapping>(`/api/admin/ontology/${entityId}`, body)
  return r.data
}

export async function setDisplayColumn(entityId: string, display_column: OntologyDisplayColumn): Promise<void> {
  await api.put(`/api/admin/ontology/${entityId}/display-column`, { display_column })
}

export async function toggleVisibility(entityId: string, statement: 'pl' | 'bs', tflux_caption: string, is_hidden: boolean) {
  await api.patch(`/api/admin/ontology/${entityId}/visibility`, null, {
    params: { statement, tflux_caption, is_hidden },
  })
}

export async function resyncOntology(entityId: string): Promise<void> {
  await api.post(`/api/admin/ontology/${entityId}/resync`)
}

export async function resetMappings(
  entityId: string,
  statement: 'pl' | 'bs',
): Promise<{ ok: boolean; mappings_cleared: number; custom_captions_cleared: number }> {
  const r = await api.post<{ ok: boolean; mappings_cleared: number; custom_captions_cleared: number }>(
    `/api/admin/ontology/${entityId}/reset-mappings`,
    null,
    { params: { statement } },
  )
  return r.data
}

export async function getCustomCaptions(entityId: string): Promise<CustomCaption[]> {
  const r = await api.get<CustomCaption[]>(`/api/admin/ontology/${entityId}/custom-captions`)
  return r.data
}

export async function addCustomCaption(entityId: string, body: {
  statement: 'pl' | 'bs'; name: string; is_subtotal?: boolean
  erp_gl_json?: string[]
  erp_subgl_json?: string[]
  erp_subledger_json?: Array<string | { type?: string; code?: string; name?: string; label?: string }>
}): Promise<CustomCaption> {
  const r = await api.post<CustomCaption>(`/api/admin/ontology/${entityId}/custom-captions`, body)
  return r.data
}

export async function deleteCustomCaption(entityId: string, capId: number) {
  await api.delete(`/api/admin/ontology/${entityId}/custom-captions/${capId}`)
}

/** Authenticated CSV download (anchor href would omit Bearer token). */
export async function downloadOntologyCsv(entityId: string): Promise<void> {
  const r = await api.get(`/api/admin/ontology/${entityId}/export.csv`, { responseType: 'blob' })
  const blob = new Blob([r.data as BlobPart], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ontology_${entityId}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
