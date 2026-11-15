// @author  veera
// @file    features/admin-integrations/quickBooksApi.ts
//
// Typed client for QuickBooks Online admin endpoints.

import api from '@/api/client'
import type { ErpAccountOut } from '@/types/models'

const BASE = '/api/admin/integrations/quickbooks'

export const QB_DEFAULT_REDIRECT_URI =
  'http://localhost:5173/api/admin/integrations/quickbooks/callback'
export const QB_DEFAULT_SCOPE = 'com.intuit.quickbooks.accounting'
export const QB_DEFAULT_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2'
export const QB_DEFAULT_TOKEN_URL =
  'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
export const QB_DEFAULT_API_BASE_SANDBOX = 'https://sandbox-quickbooks.api.intuit.com'
export const QB_DEFAULT_API_BASE_PRODUCTION = 'https://quickbooks.api.intuit.com'

export interface QbCredentialOut {
  credential_id?: number | null
  entity_id: string
  erp_type: string
  redirect_uri?: string | null
  environment: string
  scopes?: string | null
  auth_url?: string | null
  token_url?: string | null
  api_base_sandbox?: string | null
  api_base_production?: string | null
  masked_client_id?: string | null
  client_secret_last4?: string | null
  status: string
  connection_status: string
  token_status: string
  realm_id?: string | null
  company_name?: string | null
  token_expiry?: string | null
  last_safe_error_code?: string | null
  last_safe_error_message?: string | null
  last_tested_at?: string | null
  last_verified_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface QbCredentialUpsert {
  entity_id: string
  client_id?: string
  client_secret?: string
  redirect_uri?: string
  environment?: 'sandbox' | 'production'
  scopes?: string
  auth_url?: string
  token_url?: string
  api_base_sandbox?: string
  api_base_production?: string
}

export interface QbStatusOut {
  entity_id: string
  erp_type: string
  status: string
  connection_status: string
  token_status: string
  realm_id?: string | null
  company_name?: string | null
  environment: string
  token_expiry?: string | null
  last_safe_error_code?: string | null
  last_safe_error_message?: string | null
  connected: boolean
  credentials_saved: boolean
}

export interface QbConnectorOut {
  ok: boolean
  records_processed?: number
  safe_error_code?: string | null
  safe_error_message?: string | null
  company_name?: string | null
  realm_id?: string | null
  gl_sync_diagnostics?: Record<string, unknown> | null
}

export interface QbReadinessOut {
  entity_code: string
  erp_type: string
  credential_verified: boolean
  company_selected: boolean
  gl_ready: boolean
  transaction_ready: boolean
  api_complete: boolean
  customers_ready?: boolean
  vendors_ready?: boolean
  missing?: string[]
  gl_account_count?: number | null
  general_ledger_entry_count?: number | null
  customers_count?: number | null
  vendors_count?: number | null
  gl_last_synced_at?: string | null
  entries_last_synced_at?: string | null
  customers_last_synced_at?: string | null
  vendors_last_synced_at?: string | null
}

export async function getQbCredentials(entityCode: string): Promise<QbCredentialOut> {
  const r = await api.get<QbCredentialOut>(
    `${BASE}/credentials/${encodeURIComponent(entityCode)}`,
  )
  return r.data
}

export async function saveQbCredentials(body: QbCredentialUpsert): Promise<QbCredentialOut> {
  const r = await api.post<QbCredentialOut>(`${BASE}/credentials`, body)
  return r.data
}

export async function getQbStatus(entityCode: string): Promise<QbStatusOut> {
  const r = await api.get<QbStatusOut>(`${BASE}/status/${encodeURIComponent(entityCode)}`)
  return r.data
}

export async function startQbConnect(entityId: string): Promise<{ authorization_url: string }> {
  const r = await api.get<{ authorization_url: string }>(
    `${BASE}/connect?entity_id=${encodeURIComponent(entityId)}`,
  )
  return r.data
}

export async function testQbConnection(entityId: string): Promise<QbConnectorOut> {
  const r = await api.post<QbConnectorOut>(`${BASE}/test-connection`, { entity_id: entityId })
  return r.data
}

export async function disconnectQb(entityId: string): Promise<{ ok: boolean }> {
  const r = await api.post<{ ok: boolean }>(`${BASE}/disconnect`, { entity_id: entityId })
  return r.data
}

export async function syncQbAccounts(entityId: string): Promise<QbConnectorOut> {
  const r = await api.post<QbConnectorOut>(`${BASE}/sync/accounts`, { entity_id: entityId })
  return r.data
}

export async function syncQbGeneralLedger(
  entityId: string,
  startDate?: string,
  endDate?: string,
): Promise<QbConnectorOut> {
  const r = await api.post<QbConnectorOut>(`${BASE}/sync/general-ledger`, {
    entity_id: entityId,
    start_date: startDate,
    end_date: endDate,
  })
  return r.data
}

export async function syncQbCustomers(entityId: string): Promise<QbConnectorOut> {
  const r = await api.post<QbConnectorOut>(`${BASE}/sync/customers`, { entity_id: entityId })
  return r.data
}

export async function syncQbVendors(entityId: string): Promise<QbConnectorOut> {
  const r = await api.post<QbConnectorOut>(`${BASE}/sync/vendors`, { entity_id: entityId })
  return r.data
}

export async function getQbReadiness(entityCode: string): Promise<QbReadinessOut> {
  const r = await api.get<QbReadinessOut>(`${BASE}/readiness/${encodeURIComponent(entityCode)}`)
  return r.data
}

export async function getQbGlAccounts(entityCode: string): Promise<ErpAccountOut[]> {
  const r = await api.get<ErpAccountOut[]>(`${BASE}/accounts/${encodeURIComponent(entityCode)}`)
  return r.data
}
