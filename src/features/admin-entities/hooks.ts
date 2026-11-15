// @author  veera
// @file    features/admin-entities/hooks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as adminEntitiesApi from './api'

export const adminEntitiesKey = ['admin-entities'] as const

export function useAdminEntities() {
  return useQuery({
    queryKey: adminEntitiesKey,
    queryFn: () => adminEntitiesApi.adminListEntities(),
  })
}

export function useCreateEntity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: adminEntitiesApi.CreateInput) => adminEntitiesApi.adminCreateEntity(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminEntitiesKey })
      qc.invalidateQueries({ queryKey: ['entities'] })
    },
  })
}
