// @author  veera
// @file    features/signoffs/hooks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as signoffsApi from './api'

export function useSignoffs(entityId: string | null) {
  return useQuery({
    queryKey: ['signoffs', entityId],
    queryFn: () => signoffsApi.getSignoffs(entityId!),
    enabled: !!entityId,
  })
}

export function useSignCaption() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entityId, caption }: { entityId: string; caption: string }) =>
      signoffsApi.signCaption(entityId, caption),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['signoffs', v.entityId] }),
  })
}

export function useClearSignoff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entityId, caption }: { entityId: string; caption: string }) =>
      signoffsApi.clearSignoff(entityId, caption),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['signoffs', v.entityId] }),
  })
}

export function useBulkSignoff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entityId, statement }: { entityId: string; statement: 'pl' | 'bs' }) =>
      signoffsApi.bulkSignoff(entityId, statement),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['signoffs', v.entityId] }),
  })
}
