// @author  veera
// @file    features/entities/hooks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as entitiesApi from './api'
import type { EntityStatus } from '@/types/models'

export const entitiesKey = ['entities'] as const

export function useEntities(filters: entitiesApi.ListFilters = {}) {
  return useQuery({
    queryKey: [...entitiesKey, filters],
    queryFn: () => entitiesApi.listEntities(filters),
  })
}

export function useEntity(id: string | null | undefined) {
  return useQuery({
    queryKey: [...entitiesKey, 'one', id],
    queryFn: () => entitiesApi.getEntity(id!),
    enabled: !!id,
  })
}

export function usePatchEntityStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: EntityStatus; note?: string }) =>
      entitiesApi.patchEntityStatus(id, status, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: entitiesKey }),
  })
}
