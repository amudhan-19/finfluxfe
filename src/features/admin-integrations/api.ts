// @author  veera
// @file    features/admin-integrations/api.ts
//
// Routes are mounted under `/api/admin/integrations/` (product docs may list
// `/api/admin/erp-catalog`, `/api/admin/entity-erp-mappings`, `/api/admin/entities/:code/api-map/*`).

import api from '@/api/client'
import type { ApiCredential, ApiLayer, EntityErpMapping, ErpCatalogItem } from '@/types/models'

export async function getCatalog(): Promise<ErpCatalogItem[]> {
  const r = await api.get<ErpCatalogItem[]>('/api/admin/integrations/catalog')
  return r.data
}

export async function getMappings(): Promise<EntityErpMapping[]> {
  const r = await api.get<EntityErpMapping[]>('/api/admin/integrations/entity-erp-mappings')
  return r.data
}

export async function connectErp(entity_id: string, erp_key: string): Promise<EntityErpMapping> {
  const r = await api.post<EntityErpMapping>('/api/admin/integrations/entity-erp-mappings', { entity_id, erp_key })
  return r.data
}

export async function disconnectErp(mapping_id: number) {
  await api.delete(`/api/admin/integrations/entity-erp-mappings/${mapping_id}`)
}

export async function resyncMapping(mapping_id: number) {
  const r = await api.post(`/api/admin/integrations/entity-erp-mappings/${mapping_id}/resync`)
  return r.data
}

export async function getApiMap(entity_id: string): Promise<ApiCredential[]> {
  const r = await api.get<ApiCredential[]>(`/api/admin/integrations/entities/${entity_id}/api-map`)
  return r.data
}

export interface UpsertCred {
  layer: ApiLayer
  item_name?: string
  endpoint: string
  auth_type?: string
  secret?: string
}

export async function upsertCred(entity_id: string, body: UpsertCred): Promise<ApiCredential> {
  const r = await api.post<ApiCredential>(`/api/admin/integrations/entities/${entity_id}/api-map`, body)
  return r.data
}

export async function deleteCred(entity_id: string, cred_id: number) {
  await api.delete(`/api/admin/integrations/entities/${entity_id}/api-map/${cred_id}`)
}

export async function testCred(entity_id: string, cred_id: number) {
  const r = await api.post(`/api/admin/integrations/entities/${entity_id}/api-map/${cred_id}/test`)
  return r.data
}

export async function syncCred(entity_id: string, cred_id: number) {
  const r = await api.post(`/api/admin/integrations/entities/${entity_id}/api-map/${cred_id}/sync`)
  return r.data
}

export interface ApiCompleteOut {
  complete: boolean
  gl: boolean
  sub_gl: boolean
  transaction: boolean
  /** Present only when the entity is mapped to Business Central. */
  erp_type?: 'business_central' | 'quickbooks'
}

export async function apiComplete(entity_id: string): Promise<ApiCompleteOut> {
  const r = await api.get<ApiCompleteOut>(
    `/api/admin/integrations/entities/${entity_id}/api-complete`,
  )
  return r.data
}
