// @author  veera
// @file    utils/fluxReviewFilters.ts
//
// Pure, frontend-only helpers for the Flux Review filter toolbar and the
// per-row review-status derivation. No backend calls, no data-shape changes —
// everything is computed from the already-loaded flux rows, AI commentary,
// sign-offs and (existing-endpoint) comment counts.

import type { AppBadgeVariant } from '@/components/ui/AppBadge'
import type { AiCommentary, FluxRow, Signoff } from '@/types/models'
import { fluxDisplayVariance } from '@/utils/fluxFinanceVariance'

/** Lightweight comment summary for one caption (derived client-side from the
 *  existing `GET /comments?caption=` endpoint). */
export interface CaptionCommentInfo {
  total: number
  unresolved: number
}

export type ReviewStatus =
  | 'needs_review'
  | 'reviewed'
  | 'signed_off'
  | 'rejected'
  | 'comment_pending'

export type VarianceSign = 'all' | 'positive' | 'negative'
export type AiSource = 'all' | 'ai' | 'edited'

export interface FluxFilterState {
  search: string
  materialOnly: boolean
  withComments: boolean
  unsignedOnly: boolean
  variance: VarianceSign
  aiSource: AiSource
  /** Multi-select review-status chips. Empty array means "no status filter". */
  statuses: ReviewStatus[]
}

export const EMPTY_FLUX_FILTERS: FluxFilterState = {
  search: '',
  materialOnly: false,
  withComments: false,
  unsignedOnly: false,
  variance: 'all',
  aiSource: 'all',
  statuses: [],
}

export const REVIEW_STATUS_META: Record<
  ReviewStatus,
  { label: string; badge: AppBadgeVariant; modifier: string }
> = {
  needs_review: { label: 'Needs review', badge: 'warning', modifier: 'needs-review' },
  reviewed: { label: 'Reviewed', badge: 'info', modifier: 'reviewed' },
  signed_off: { label: 'Signed off', badge: 'success', modifier: 'signed-off' },
  rejected: { label: 'Rejected', badge: 'danger', modifier: 'rejected' },
  comment_pending: { label: 'Comment pending', badge: 'primary', modifier: 'comment-pending' },
}

/** Order used when rendering the status chip row. */
export const REVIEW_STATUS_ORDER: readonly ReviewStatus[] = [
  'needs_review',
  'reviewed',
  'signed_off',
  'comment_pending',
  'rejected',
]

function hasAnyAiText(ai?: AiCommentary): boolean {
  if (!ai) return false
  return Boolean(ai.edited_text || ai.detailed_text || ai.concise_text)
}

/** Derive a single review status for a caption from the real data available.
 *  Priority is intentionally ordered so the most actionable state wins. */
export function deriveReviewStatus(args: {
  row: FluxRow
  ai?: AiCommentary
  sign?: Signoff
  comment?: CaptionCommentInfo
  entityStatus: string
}): ReviewStatus {
  const { ai, sign, comment, entityStatus } = args

  if (sign && !sign.is_stale) return 'signed_off'
  if (comment && comment.unresolved > 0) return 'comment_pending'
  if (entityStatus === 'rejected') return 'rejected'
  if (sign && sign.is_stale) return 'needs_review'
  if (hasAnyAiText(ai)) return 'reviewed'
  return 'needs_review'
}

/** True when the caption is effectively unsigned (never signed, or signed but
 *  the commentary version changed and the sign-off went stale). */
export function isUnsigned(sign?: Signoff): boolean {
  return !sign || sign.is_stale
}

export interface FluxFilterRowContext {
  row: FluxRow
  ai?: AiCommentary
  sign?: Signoff
  comment?: CaptionCommentInfo
  status: ReviewStatus
}

/** AND-combine every active filter. Status chips are OR'd among themselves. */
export function matchesFluxFilters(
  filters: FluxFilterState,
  ctx: FluxFilterRowContext,
): boolean {
  const { row, ai, sign, comment, status } = ctx

  const search = filters.search.trim().toLowerCase()
  if (search && !row.caption.toLowerCase().includes(search)) return false

  if (filters.materialOnly && !row.is_material) return false

  if (filters.withComments && !(comment && comment.total > 0)) return false

  if (filters.unsignedOnly && !isUnsigned(sign)) return false

  if (filters.variance !== 'all') {
    const dv = fluxDisplayVariance(row)
    if (filters.variance === 'positive' && !dv.positive) return false
    if (filters.variance === 'negative' && dv.positive) return false
  }

  if (filters.aiSource === 'ai' && !(ai && (ai.detailed_text || ai.concise_text))) return false
  if (filters.aiSource === 'edited' && !(ai && ai.edited_text)) return false

  if (filters.statuses.length > 0 && !filters.statuses.includes(status)) return false

  return true
}

/** Count of active (non-default) filters — used to badge the "Clear" affordance. */
export function activeFilterCount(filters: FluxFilterState): number {
  let n = 0
  if (filters.search.trim()) n++
  if (filters.materialOnly) n++
  if (filters.withComments) n++
  if (filters.unsignedOnly) n++
  if (filters.variance !== 'all') n++
  if (filters.aiSource !== 'all') n++
  n += filters.statuses.length
  return n
}
