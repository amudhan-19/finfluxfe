// @author  veera
// @file    features/admin-integrations/businessCentralApi.ts
//
// Typed client for the Business Central admin endpoints. Plaintext
// credentials are sent over POST only and are NEVER stored in this layer.
// The save endpoint returns only safe metadata (masked tails, status,
// timestamps) — see BcCredentialOut.

import api from '@/api/client'
import type {
  BcCompanyOut,
  BcConnectorResponse,
  BcCredentialOut,
  BcReadinessOut,
  ErpAccountOut,
  ErpSubledgerOptionOut,
  ErpGlEntryOut,
} from '@/types/models'

const BASE = '/api/admin/integrations/business-central'

export interface BcCredentialUpsert {
  entity_id: string
  tenant_id?: string
  client_id?: string
  client_secret?: string
  environment_name?: string
  scope?: string
  base_url?: string
  company_id?: string | null
  company_name?: string | null
}

export const BC_DEFAULT_BASE_URL = 'https://api.businesscentral.dynamics.com'
export const BC_DEFAULT_SCOPE    = 'https://api.businesscentral.dynamics.com/.default'

export async function getBcCredentials(entityCode: string): Promise<BcCredentialOut | null> {
  try {
    const r = await api.get<BcCredentialOut>(`${BASE}/credentials/${encodeURIComponent(entityCode)}`)
    return r.data
  } catch (e: unknown) {
    if (isAxios404(e)) return null
    throw e
  }
}

export async function saveBcCredentials(body: BcCredentialUpsert): Promise<BcCredentialOut> {
  const r = await api.post<BcCredentialOut>(`${BASE}/credentials`, body)
  return r.data
}

export async function testBcConnection(entityId: string): Promise<BcConnectorResponse> {
  const r = await api.post<BcConnectorResponse>(`${BASE}/test`, { entity_id: entityId })
  return r.data
}

export async function fetchBcCompanies(entityId: string): Promise<BcConnectorResponse> {
  const r = await api.post<BcConnectorResponse>(`${BASE}/fetch-companies`, { entity_id: entityId })
  return r.data
}

export async function listBcCompanies(entityCode: string): Promise<BcCompanyOut[]> {
  const r = await api.get<BcCompanyOut[]>(`${BASE}/companies/${encodeURIComponent(entityCode)}`)
  return r.data
}

export async function syncBcGlAccounts(
  entityId: string, companyId?: string,
): Promise<BcConnectorResponse> {
  const r = await api.post<BcConnectorResponse>(`${BASE}/sync/gl-accounts`,
    { entity_id: entityId, company_id: companyId })
  return r.data
}

export async function syncBcGlEntries(
  entityId: string, companyId?: string,
  fromDate?: string, toDate?: string,
): Promise<BcConnectorResponse> {
  const r = await api.post<BcConnectorResponse>(`${BASE}/sync/gl-entries`, {
    entity_id: entityId,
    company_id: companyId,
    from_date: fromDate,
    to_date: toDate,
  })
  return r.data
}

export async function syncBcDimensions(
  entityId: string, companyId?: string,
): Promise<BcConnectorResponse> {
  const r = await api.post<BcConnectorResponse>(`${BASE}/sync/dimensions`,
    { entity_id: entityId, company_id: companyId })
  return r.data
}

export async function syncBcCustomers(
  entityId: string, companyId?: string,
): Promise<BcConnectorResponse> {
  const r = await api.post<BcConnectorResponse>(`${BASE}/sync/customers`, {
    entity_id: entityId, company_id: companyId,
  })
  return r.data
}

export async function syncBcVendors(
  entityId: string, companyId?: string,
): Promise<BcConnectorResponse> {
  const r = await api.post<BcConnectorResponse>(`${BASE}/sync/vendors`, {
    entity_id: entityId, company_id: companyId,
  })
  return r.data
}

export async function syncBcCustomerLedgerEntries(
  entityId: string, companyId?: string,
): Promise<BcConnectorResponse> {
  const r = await api.post<BcConnectorResponse>(`${BASE}/sync/customer-ledger-entries`, {
    entity_id: entityId, company_id: companyId,
  })
  return r.data
}

export async function syncBcVendorLedgerEntries(
  entityId: string, companyId?: string,
): Promise<BcConnectorResponse> {
  const r = await api.post<BcConnectorResponse>(`${BASE}/sync/vendor-ledger-entries`, {
    entity_id: entityId, company_id: companyId,
  })
  return r.data
}

export async function getBcReadiness(entityCode: string): Promise<BcReadinessOut> {
  const r = await api.get<BcReadinessOut>(`${BASE}/readiness/${encodeURIComponent(entityCode)}`)
  return r.data
}

export async function getBcGlAccounts(entityCode: string): Promise<ErpAccountOut[]> {
  const r = await api.get<ErpAccountOut[]>(
    `${BASE}/erp-gl-accounts/${encodeURIComponent(entityCode)}`)
  return r.data
}

export async function getBcSubledgerDetails(entityCode: string): Promise<ErpSubledgerOptionOut[]> {
  const r = await api.get<ErpSubledgerOptionOut[]>(
    `${BASE}/erp-subledger-details/${encodeURIComponent(entityCode)}`)
  return r.data
}

export async function getBcTransactions(
  entityCode: string, limit = 500,
): Promise<ErpGlEntryOut[]> {
  const r = await api.get<ErpGlEntryOut[]>(
    `${BASE}/erp-transactions/${encodeURIComponent(entityCode)}`,
    { params: { limit } })
  return r.data
}

export async function setBcCompany(
  entityId: string, companyId: string, companyName: string,
): Promise<BcCredentialOut> {
  const r = await api.patch<BcCredentialOut>(`${BASE}/company`, {
    entity_id: entityId, company_id: companyId, company_name: companyName,
  })
  return r.data
}

/** Hard-resets a Business Central credential row plus any companies / GL
 *  accounts / GL entries previously synced for the entity. Use when the row
 *  is unreadable (INVALID_CONFIG) or the admin wants to start clean. */
export async function deleteBcCredentials(entityCode: string): Promise<void> {
  await api.delete(`${BASE}/credentials/${encodeURIComponent(entityCode)}`)
}

function isAxios404(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false
  const maybe = e as { response?: { status?: number } }
  return maybe.response?.status === 404
}
