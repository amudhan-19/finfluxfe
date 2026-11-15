// @author  veera
// @file    features/profile/hooks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as profileApi from './api'
import type { CompanyProfile, Threshold } from '@/types/models'

export function useProfile(entityId: string | null) {
  return useQuery({
    queryKey: ['profile', entityId],
    queryFn: () => profileApi.getProfile(entityId!),
    enabled: !!entityId,
  })
}

export function usePutProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entityId, body }: { entityId: string; body: Partial<CompanyProfile> }) =>
      profileApi.putProfile(entityId, body),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['profile', v.entityId] }),
  })
}

export function useThresholds(entityId: string | null) {
  return useQuery({
    queryKey: ['thresholds', entityId],
    queryFn: () => profileApi.getThresholds(entityId!),
    enabled: !!entityId,
  })
}

export function usePutThresholds() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entityId, body }: { entityId: string; body: Threshold }) =>
      profileApi.putThresholds(entityId, body),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['thresholds', v.entityId] }),
  })
}

export function usePutPeriods() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entityId, body }: { entityId: string; body: { period_type: string; period_from: string; period_to: string } }) =>
      profileApi.putPeriods(entityId, body),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['entities'] })
      qc.invalidateQueries({ queryKey: ['flux', v.entityId] })
    },
  })
}
