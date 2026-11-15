// @author  veera
// @file    features/flux-period/api.ts
//
// Per-entity Flux period config + BC regeneration. Lives behind the
// existing /api/entities/* prefix so it inherits the global axios auth
// interceptor; never talks to BC directly.

import api from '@/api/client'
import type {
  FluxGenerationDiagnostics,
  SavePeriodAndGenerateRequest,
  SavePeriodAndGenerateResponse,
} from '@/types/models'

export async function getFluxGenerationDiagnostics(
  entityId: string,
  statement?: 'pl' | 'bs' | 'both',
): Promise<FluxGenerationDiagnostics> {
  const r = await api.get<FluxGenerationDiagnostics>(
    `/api/entities/${entityId}/flux-generation-diagnostics`,
    { params: statement ? { statement } : undefined },
  )
  return r.data
}

export async function savePeriodAndGenerate(
  entityId: string,
  body: SavePeriodAndGenerateRequest,
): Promise<SavePeriodAndGenerateResponse> {
  const r = await api.post<SavePeriodAndGenerateResponse>(
    `/api/entities/${entityId}/flux/save-period-and-generate`,
    body,
  )
  return r.data
}
