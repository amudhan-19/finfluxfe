// @author  veera
// @file    features/comments/hooks.ts

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import * as commentsApi from './api'
import type { CaptionCommentInfo } from '@/utils/fluxReviewFilters'

export function useComments(entityId: string | null, caption: string | null) {
  return useQuery({
    queryKey: ['comments', entityId, caption],
    queryFn: () => commentsApi.getComments(entityId!, caption!),
    enabled: !!entityId && !!caption,
  })
}

/** Aggregate comment counts for many captions at once.
 *
 *  Reuses the exact same React Query keys as `useComments` so the cache is
 *  shared (and `useAddComment` / `useResolveComment` invalidations refresh
 *  these too). Frontend-only: hits the existing per-caption endpoint, no new
 *  backend route required. */
export function useCaptionsComments(
  entityId: string | null,
  captions: string[],
): Record<string, CaptionCommentInfo> {
  return useQueries({
    queries: captions.map((caption) => ({
      queryKey: ['comments', entityId, caption],
      queryFn: () => commentsApi.getComments(entityId!, caption),
      enabled: !!entityId,
      staleTime: 30_000,
    })),
    combine: (results) => {
      const map: Record<string, CaptionCommentInfo> = {}
      captions.forEach((caption, i) => {
        const data = results[i]?.data ?? []
        map[caption] = {
          total: data.length,
          unresolved: data.filter((c) => !c.is_resolved).length,
        }
      })
      return map
    },
  })
}

export function useAddComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entityId, caption, text, parent_id }: { entityId: string; caption: string; text: string; parent_id?: number }) =>
      commentsApi.addComment(entityId, caption, text, parent_id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['comments', vars.entityId, vars.caption] })
      qc.invalidateQueries({ queryKey: ['signoffs', vars.entityId] })
    },
  })
}

export function useResolveComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entityId, commentId }: { entityId: string; commentId: number }) =>
      commentsApi.resolveComment(entityId, commentId),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['comments', v.entityId] }),
  })
}
