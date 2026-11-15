// @author  veera
// @file    features/macro/hooks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as macroApi from './api'

export function useMacroFactors(entityId: string | null) {
  return useQuery({
    queryKey: ['macro', entityId],
    queryFn: () => macroApi.getMacroFactors(entityId!),
    enabled: !!entityId,
  })
}

export function useAddMacro() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entityId, body }: { entityId: string; body: { category: string; icon?: string; text: string } }) =>
      macroApi.addMacroFactor(entityId, body),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['macro', v.entityId] }),
  })
}

export function useDeleteMacro() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entityId, id }: { entityId: string; id: number }) =>
      macroApi.deleteMacroFactor(entityId, id),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['macro', v.entityId] }),
  })
}
