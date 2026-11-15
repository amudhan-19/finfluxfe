// @author  veera
// @file    features/chat/hooks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as chatApi from './api'

export function useChat(entityId: string | null) {
  return useQuery({
    queryKey: ['chat', entityId],
    queryFn: () => chatApi.getChat(entityId!),
    enabled: !!entityId,
  })
}

export function usePostMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entityId, text }: { entityId: string; text: string }) => chatApi.postMessage(entityId, text),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['chat', v.entityId] }),
  })
}

export function useReplyMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entityId, messageId, text }: { entityId: string; messageId: number; text: string }) =>
      chatApi.replyMessage(entityId, messageId, text),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['chat', v.entityId] }),
  })
}

export function useFlagMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entityId, messageId }: { entityId: string; messageId: number }) =>
      chatApi.flagMessage(entityId, messageId),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['chat', v.entityId] }),
  })
}
