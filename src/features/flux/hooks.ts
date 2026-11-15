// @author  veera
// @file    features/flux/hooks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as fluxApi from './api'

export function useFlux(entityId: string | null, statement: 'pl' | 'bs') {
  return useQuery({
    queryKey: ['flux', entityId, statement],
    queryFn: () => fluxApi.getFlux(entityId!, statement),
    enabled: !!entityId,
  })
}

export function useAiCommentary(entityId: string | null) {
  return useQuery({
    queryKey: ['ai-commentary', entityId],
    queryFn: () => fluxApi.getAllAi(entityId!),
    enabled: !!entityId,
  })
}

export function useEditAi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entityId, caption, text }: { entityId: string; caption: string; text: string }) =>
      fluxApi.patchAi(entityId, caption, text),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['ai-commentary', vars.entityId] }),
  })
}

/** Generate Flux AI commentary for one (statement, caption) and refresh the
 *  ai-commentary query so the table re-renders with the new text. The hook
 *  resolves with the full response (`ok=true|false`) so callers can show a
 *  contextual toast for SLM-side failures without throwing. */
export function useGenerateFluxAi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      entityId, statement, caption,
    }: { entityId: string; statement: 'pl' | 'bs'; caption: string }) =>
      fluxApi.generateFluxAi(entityId, statement, caption),
    onSuccess: (data, vars) => {
      if (data.ok) {
        qc.invalidateQueries({ queryKey: ['ai-commentary', vars.entityId] })
      }
    },
  })
}
