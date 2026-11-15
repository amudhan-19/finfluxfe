// @author  veera
// @file    features/workflow/hooks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as wfApi from './api'

export function useSubmit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => wfApi.submitEntity(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entities'] }),
  })
}

export function useApprove() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => wfApi.approveEntity(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entities'] }),
  })
}

export function useReject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => wfApi.rejectEntity(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entities'] }),
  })
}

export function useSendForApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => wfApi.sendForApproval(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entities'] }),
  })
}

export function useDirectorQueue() {
  return useQuery({ queryKey: ['director-queue'], queryFn: () => wfApi.directorQueue() })
}
