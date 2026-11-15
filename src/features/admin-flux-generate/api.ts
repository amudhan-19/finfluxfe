// @author  veera
// @file    features/admin-flux-generate/api.ts
//
// Admin-only client for the BC → Flux generation pipeline. Two endpoints:
//   • POST /api/admin/entities/{id}/generate-flux-from-bc  (preview + commit)
//   • GET  /api/admin/entities/{id}/bc-flux-diagnostics
//
// Server enforces RBAC; this layer only typesafe-wraps the request shape so
// the OntologyPage component cannot pass a malformed body by accident.

import api from '@/api/client'
import type {
  BcFluxDiagnostics,
  FluxGenerateRequest,
  FluxGenerateResponse,
} from '@/types/models'

export async function generateFluxFromBc(
  entityId: string,
  body: FluxGenerateRequest,
): Promise<FluxGenerateResponse> {
  const r = await api.post<FluxGenerateResponse>(
    `/api/admin/entities/${entityId}/generate-flux-from-bc`,
    body,
  )
  return r.data
}

export async function generateFluxFromQb(
  entityId: string,
  body: FluxGenerateRequest,
): Promise<FluxGenerateResponse> {
  const r = await api.post<FluxGenerateResponse>(
    `/api/admin/entities/${entityId}/generate-flux-from-quickbooks`,
    body,
  )
  return r.data
}

export async function getBcFluxDiagnostics(
  entityId: string,
): Promise<BcFluxDiagnostics> {
  const r = await api.get<BcFluxDiagnostics>(
    `/api/admin/entities/${entityId}/bc-flux-diagnostics`,
  )
  return r.data
}
