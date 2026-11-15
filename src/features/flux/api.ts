// @author  veera
// @file    features/flux/api.ts

import api from '@/api/client'
import type {
  FluxRow, AiCommentary, FluxAiGenerateResponse,
} from '@/types/models'

export async function getFlux(entityId: string, statement: 'pl' | 'bs'): Promise<FluxRow[]> {
  const r = await api.get<FluxRow[]>(`/api/entities/${entityId}/flux`, { params: { statement } })
  return r.data
}

export async function getAllAi(entityId: string): Promise<AiCommentary[]> {
  const r = await api.get<AiCommentary[]>(`/api/entities/${entityId}/ai-commentary`)
  return r.data
}

export async function patchAi(entityId: string, caption: string, text: string): Promise<AiCommentary> {
  const r = await api.patch<AiCommentary>(`/api/entities/${entityId}/ai-commentary/${encodeURIComponent(caption)}`, { text })
  return r.data
}

/** Trigger Flux AI commentary generation for one (statement, caption).
 *  The backend proxies to the SLM gateway — the browser never sees the
 *  SLM URL, project id, template id, or API key. */
export async function generateFluxAi(
  entityId: string,
  statement: 'pl' | 'bs',
  caption: string,
): Promise<FluxAiGenerateResponse> {
  const r = await api.post<FluxAiGenerateResponse>(
    `/api/entities/${entityId}/flux-ai/generate`,
    { statement, caption },
  )
  return r.data
}
