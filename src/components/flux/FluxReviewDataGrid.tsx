// @author  veera
// @file    components/flux/FluxReviewDataGrid.tsx
//
// Premium, executive-friendly Flux Review table. Replaces the old MUI
// DataGrid (which expanded long AI commentary inside the row) with a
// semantic, sticky-header / sticky-first-column table. Full detailed
// commentary, comments and sign-off history now open in the right-side
// FluxDetailPanel drawer; the table only shows a compact 1–2 line preview.
//
// Pure presentation + existing callbacks — no calculations, no AI generation,
// no data-shape changes.

import { useMemo, type MouseEvent } from 'react'
import {
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  PenLine,
  Sparkles,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { DetailedAiCommentary } from '@/components/flux/AiCommentaryDisplay'
import { canEditAi, canGenerateAi, canSignOff } from '@/utils/rbac'
import { U } from '@/constants/uiText'
import { ff } from '@/utils/helpers'
import { cleanAiText } from '@/utils/aiText'
import { fluxDisplayVariance } from '@/utils/fluxFinanceVariance'
import {
  deriveReviewStatus,
  matchesFluxFilters,
  REVIEW_STATUS_META,
  type CaptionCommentInfo,
  type FluxFilterState,
  type ReviewStatus,
} from '@/utils/fluxReviewFilters'
import type {
  AiCommentary,
  FluxRow as FluxRowT,
  Role,
  Signoff,
} from '@/types/models'

export type FluxReviewDataGridProps = {
  rows: FluxRowT[]
  entityId: string
  role: Role
  aiMode: 'concise' | 'detailed'
  aiByCap: Record<string, AiCommentary>
  signByCap: Record<string, Signoff>
  commentInfoByCap: Record<string, CaptionCommentInfo>
  filters: FluxFilterState
  entityStatus: string
  selectedCaption: string | null
  isLoading: boolean
  generatingAiCaption: string | null
  onSelectRow: (caption: string) => void
  onSign: (caption: string) => void
  onClear: (caption: string) => void
  onGenerateAi: (caption: string) => void
}

interface PreparedRow {
  row: FluxRowT
  index: number
  ai?: AiCommentary
  sign?: Signoff
  comment?: CaptionCommentInfo
  status: ReviewStatus
}

export function FluxReviewDataGrid({
  rows,
  role,
  aiMode,
  aiByCap,
  signByCap,
  commentInfoByCap,
  filters,
  entityStatus,
  selectedCaption,
  isLoading,
  generatingAiCaption,
  onSelectRow,
  onSign,
  onClear,
  onGenerateAi,
}: FluxReviewDataGridProps) {
  const showSignOff = canSignOff(role)

  const prepared = useMemo<PreparedRow[]>(() => {
    return rows.map((row, i) => {
      const ai = aiByCap[row.caption]
      const sign = signByCap[row.caption]
      const comment = commentInfoByCap[row.caption]
      const status = deriveReviewStatus({ row, ai, sign, comment, entityStatus })
      return { row, index: i + 1, ai, sign, comment, status }
    })
  }, [rows, aiByCap, signByCap, commentInfoByCap, entityStatus])

  const visible = useMemo(
    () => prepared.filter((p) =>
      matchesFluxFilters(filters, {
        row: p.row,
        ai: p.ai,
        sign: p.sign,
        comment: p.comment,
        status: p.status,
      }),
    ),
    [prepared, filters],
  )

  if (isLoading) {
    return <div className="flux-review__loading">{`Loading${U.ellip}`}</div>
  }

  return (
    <div className="flux-table-scroll">
      <table className={`flux-table flux-table--${aiMode}`}>
        <thead className="flux-table__head">
          <tr>
            <th className="flux-table__th flux-table__th--idx flux-table__sticky-1">#</th>
            <th className="flux-table__th flux-table__th--caption flux-table__sticky-2">Caption</th>
            <th className="flux-table__th flux-table__th--num">Current</th>
            <th className="flux-table__th flux-table__th--num">Comparison</th>
            <th className="flux-table__th flux-table__th--num">$ Variance</th>
            <th className="flux-table__th flux-table__th--num">%</th>
            <th className="flux-table__th flux-table__th--ai">AI Commentary</th>
            <th className="flux-table__th flux-table__th--center">Comments</th>
            {showSignOff ? <th className="flux-table__th flux-table__th--center">Sign Off</th> : null}
          </tr>
        </thead>
        <tbody>
          {visible.length === 0 ? (
            <tr>
              <td className="flux-table__empty" colSpan={showSignOff ? 9 : 8}>
                <EmptyState title="No captions match the current filters." />
              </td>
            </tr>
          ) : (
            visible.map((p) => (
              <FluxTableRow
                key={p.row.id}
                prepared={p}
                aiMode={aiMode}
                role={role}
                selected={selectedCaption === p.row.caption}
                generating={generatingAiCaption === p.row.caption}
                showSignOff={showSignOff}
                onSelectRow={onSelectRow}
                onSign={onSign}
                onClear={onClear}
                onGenerateAi={onGenerateAi}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function FluxTableRow({
  prepared,
  aiMode,
  role,
  selected,
  generating,
  showSignOff,
  onSelectRow,
  onSign,
  onClear,
  onGenerateAi,
}: {
  prepared: PreparedRow
  aiMode: 'concise' | 'detailed'
  role: Role
  selected: boolean
  generating: boolean
  showSignOff: boolean
  onSelectRow: (caption: string) => void
  onSign: (caption: string) => void
  onClear: (caption: string) => void
  onGenerateAi: (caption: string) => void
}) {
  const { row, index, ai, sign, comment, status } = prepared
  const dv = fluxDisplayVariance(row)
  const meta = REVIEW_STATUS_META[status]
  const previewText = cleanAiText(ai?.edited_text || ai?.concise_text)
  const detailedSource = ai?.edited_text || ai?.detailed_text || ai?.concise_text
  const hasDetailed = !!cleanAiText(detailedSource)
  const varClass = dv.positive ? 'flux-table__num--pos' : 'flux-table__num--neg'

  // In Detailed mode the cell carries a long, structured insight panel, so the
  // whole row is no longer click-to-open (lets reviewers read / select text).
  // The chevron / icon tools still open the focused drawer. In Concise mode the
  // row remains a single click target.
  const isDetailed = aiMode === 'detailed'
  const open = () => onSelectRow(row.caption)
  const stop = (e: MouseEvent) => e.stopPropagation()

  return (
    <tr
      className={[
        'flux-table__row',
        isDetailed ? 'flux-table__row--detailed' : 'flux-table__row--clickable',
        selected ? 'flux-table__row--selected' : '',
        row.is_material ? 'flux-table__row--material' : '',
      ].filter(Boolean).join(' ')}
      onClick={isDetailed ? undefined : open}
      tabIndex={isDetailed ? -1 : 0}
      role={isDetailed ? undefined : 'button'}
      aria-label={isDetailed ? undefined : `Open details for ${row.caption}`}
      onKeyDown={
        isDetailed
          ? undefined
          : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } }
      }
    >
      <td className="flux-table__td flux-table__td--idx flux-table__sticky-1">{index}</td>

      <td className="flux-table__td flux-table__td--caption flux-table__sticky-2">
        <div className="flux-table__caption-wrap">
          <span className={`flux-table__caption${row.is_bold ? ' flux-table__caption--bold' : ''}`}>
            {row.is_material ? (
              <span className="flux-table__material-dot" title="Material" aria-hidden>{U.triUp}</span>
            ) : null}
            {row.caption}
          </span>
          <span className={`flux-status-tag flux-status-tag--${meta.modifier}`}>{meta.label}</span>
        </div>
      </td>

      <td className="flux-table__td flux-table__num">{ff(Number(row.current_value || 0))}</td>
      <td className="flux-table__td flux-table__num flux-table__num--muted">{ff(Number(row.comp_value || 0))}</td>
      <td className={`flux-table__td flux-table__num ${varClass}`}>{ff(dv.amount)}</td>
      <td className={`flux-table__td flux-table__num ${varClass}`}>{(dv.pct ?? 0).toFixed(1)}%</td>

      <td className="flux-table__td flux-table__td--ai">
        <div className={`flux-table__ai flux-table__ai--${aiMode}`}>
          <div className="flux-table__ai-body">
            {isDetailed ? (
              hasDetailed ? (
                <div className="flux-table__ai-detailed">
                  <DetailedAiCommentary text={detailedSource} isMaterial={row.is_material} />
                </div>
              ) : (
                <p className="flux-table__ai-preview flux-table__ai-preview--empty">No commentary yet</p>
              )
            ) : previewText ? (
              <p className="flux-table__ai-preview flux-table__ai-preview--concise">{previewText}</p>
            ) : (
              <p className="flux-table__ai-preview flux-table__ai-preview--empty">No commentary yet</p>
            )}
          </div>
          <div className="flux-table__ai-tools" onClick={stop}>
            {canGenerateAi(role) ? (
              <button
                type="button"
                className="flux-table__icon-btn flux-table__icon-btn--ai"
                onClick={() => onGenerateAi(row.caption)}
                disabled={generating}
                title={generating ? 'Generating AI commentary…' : 'Regenerate AI commentary'}
                aria-label="Regenerate AI commentary"
              >
                <Sparkles size={14} strokeWidth={2.25} />
              </button>
            ) : null}
            {canEditAi(role) ? (
              <button
                type="button"
                className="flux-table__icon-btn flux-table__icon-btn--edit"
                onClick={open}
                title="Edit AI commentary"
                aria-label="Edit AI commentary"
              >
                <PenLine size={14} strokeWidth={2.25} />
              </button>
            ) : null}
            <button
              type="button"
              className="flux-table__icon-btn flux-table__icon-btn--more"
              onClick={open}
              title="Open detailed commentary"
              aria-label="Open detailed commentary"
            >
              <ChevronRight size={15} strokeWidth={2.25} />
            </button>
          </div>
        </div>
      </td>

      <td className="flux-table__td flux-table__td--center" onClick={stop}>
        <CommentBadge
          total={comment?.total ?? 0}
          unresolved={comment?.unresolved ?? 0}
          onOpen={open}
        />
      </td>

      {showSignOff ? (
        <td className="flux-table__td flux-table__td--center" onClick={stop}>
          <SignOffCell
            sign={sign}
            onSign={() => onSign(row.caption)}
            onClear={() => onClear(row.caption)}
          />
        </td>
      ) : null}
    </tr>
  )
}

function CommentBadge({
  total,
  unresolved,
  onOpen,
}: {
  total: number
  unresolved: number
  onOpen: () => void
}) {
  const hasOpen = unresolved > 0
  return (
    <button
      type="button"
      className={[
        'flux-comment-badge',
        hasOpen ? 'flux-comment-badge--open' : '',
        total === 0 ? 'flux-comment-badge--none' : '',
      ].filter(Boolean).join(' ')}
      onClick={onOpen}
      title={
        total === 0
          ? 'No comments — open to add'
          : `${unresolved} open / ${total} total comment(s)`
      }
      aria-label={`Comments: ${unresolved} open of ${total}`}
    >
      <MessageSquare size={14} strokeWidth={2.25} />
      <span className="flux-comment-badge__count">{unresolved}/{total}</span>
    </button>
  )
}

function SignOffCell({
  sign,
  onSign,
  onClear,
}: {
  sign?: Signoff
  onSign: () => void
  onClear: () => void
}) {
  if (sign && !sign.is_stale) {
    return (
      <span
        className="flux-signoff-chip flux-signoff-chip--signed"
        title={`Signed off by ${sign.signer.name} on ${new Date(sign.signed_at).toLocaleString()}`}
      >
        <CheckCircle2 size={14} strokeWidth={2.5} className="flux-signoff-chip__icon" />
        <span className="flux-signoff-chip__label">Signed Off</span>
        <span className="flux-signoff-chip__who">{sign.signer.initials}</span>
        <button
          type="button"
          className="flux-signoff-chip__clear"
          onClick={onClear}
          title="Clear sign-off"
          aria-label="Clear sign-off"
        >
          {U.times}
        </button>
      </span>
    )
  }

  if (sign && sign.is_stale) {
    return (
      <button
        type="button"
        className="flux-signoff-btn flux-signoff-btn--stale"
        onClick={onSign}
        title="Commentary changed after sign-off — re-sign required"
      >
        Re-sign
      </button>
    )
  }

  return (
    <button
      type="button"
      className="flux-signoff-btn"
      onClick={onSign}
      title="Sign off this caption"
    >
      <CheckCircle2 size={14} strokeWidth={2.25} className="flux-signoff-btn__icon" />
      Sign Off
    </button>
  )
}
