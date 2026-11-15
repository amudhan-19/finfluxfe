// @author  veera
// @file    components/flux/FluxDetailPanel.tsx
//
// Right-side detail panel for a single Flux caption. Replaces the old
// inline row expansion: detailed AI commentary, comments and sign-off
// history now live in a structured, scrollable drawer so the table stays
// compact and executive-friendly.
//
// No backend logic / calculations / AI generation are touched — this only
// re-presents data already returned by the existing hooks.

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  Layers,
  ListChecks,
  MessageSquare,
  PenLine,
  Receipt,
  RotateCw,
  ScrollText,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import { AppButton } from '@/components/ui/AppButton'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppDrawer } from '@/components/ui/AppDrawer'
import { FormField } from '@/components/ui/FormField'
import { FormTextField } from '@/components/ui/FormTextField'
import { useComments, useAddComment, useResolveComment } from '@/features/comments/hooks'
import { canEditAi, canGenerateAi, canSignOff } from '@/utils/rbac'
import { U } from '@/constants/uiText'
import { ff, fmtD } from '@/utils/helpers'
import { cleanAiText, buildDetailedCommentaryDisplay, type DetailedSectionKey } from '@/utils/aiText'
import { fluxDisplayVariance } from '@/utils/fluxFinanceVariance'
import { REVIEW_STATUS_META, type ReviewStatus } from '@/utils/fluxReviewFilters'
import type {
  AiCommentary,
  Comment as CommentT,
  FluxRow,
  Role,
  Signoff,
} from '@/types/models'

function avatarTone(seed: string | number): number {
  const n = typeof seed === 'number' ? seed : seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return n % 6
}

const SECTION_ICON: Record<DetailedSectionKey, ReactNode> = {
  // Canonical caption-contract sections (v2)
  headline: <FileText size={15} strokeWidth={2.25} />,
  variance_bridge: <TrendingUp size={15} strokeWidth={2.25} />,
  contract_lens: <ScrollText size={15} strokeWidth={2.25} />,
  primary_drivers: <Target size={15} strokeWidth={2.25} />,
  decomposition: <Layers size={15} strokeWidth={2.25} />,
  key_transaction_evidence: <Receipt size={15} strokeWidth={2.25} />,
  drill_down_attribution: <Users size={15} strokeWidth={2.25} />,
  pattern_or_anomaly: <Clock size={15} strokeWidth={2.25} />,
  required_evidence_status: <ClipboardCheck size={15} strokeWidth={2.25} />,
  reviewer_actions: <ListChecks size={15} strokeWidth={2.25} />,
  escalation_triggers: <AlertTriangle size={15} strokeWidth={2.25} />,
  // Legacy keys (mapped to the closest canonical icon)
  executive_summary: <FileText size={15} strokeWidth={2.25} />,
  timing_and_posting_signals: <Clock size={15} strokeWidth={2.25} />,
  attribution_coverage: <Users size={15} strokeWidth={2.25} />,
  summary: <FileText size={15} strokeWidth={2.25} />,
  major_movement: <Target size={15} strokeWidth={2.25} />,
  largest_transactions: <Receipt size={15} strokeWidth={2.25} />,
  transaction_pattern: <Clock size={15} strokeWidth={2.25} />,
  customer_vendor: <Users size={15} strokeWidth={2.25} />,
  recommended_actions: <ListChecks size={15} strokeWidth={2.25} />,
}

const NARRATIVE_KEYS = new Set<DetailedSectionKey>([
  'headline',
  'executive_summary',
  'summary',
  'variance_bridge',
  'contract_lens',
  'pattern_or_anomaly',
])

// Lines describing missing / unavailable evidence are surfaced as soft amber
// cards so reviewers immediately see what the commentary could not support.
const GAP_LINE_RE = /(evidence gap|:\s*missing\b|\bnot available\b|\bunavailable\b)/i

function GapCard({ text }: { text: string }) {
  return (
    <div
      className="flux-detail-card__gap"
      style={{
        background: '#fffbeb',
        border: '1px solid #fde68a',
        color: '#92400e',
        borderRadius: 6,
        padding: '6px 10px',
        margin: '4px 0',
        fontSize: '0.88em',
      }}
    >
      {text}
    </div>
  )
}

export type FluxDetailPanelProps = {
  open: boolean
  onClose: () => void
  entityId: string
  row: FluxRow | null
  ai?: AiCommentary
  sign?: Signoff
  status: ReviewStatus | null
  role: Role
  generating: boolean
  onSign: (caption: string) => void
  onClear: (caption: string) => void
  onGenerateAi: (caption: string) => void
  onEdit: (caption: string, text: string) => void
}

export function FluxDetailPanel({
  open,
  onClose,
  entityId,
  row,
  ai,
  sign,
  status,
  role,
  generating,
  onSign,
  onClear,
  onGenerateAi,
  onEdit,
}: FluxDetailPanelProps) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    setEditing(false)
  }, [row?.caption])

  useEffect(() => {
    if (!editing || !ai) return
    setEditText(cleanAiText(ai.edited_text || ai.concise_text || ''))
  }, [editing, ai])

  const sections = useMemo(
    () => buildDetailedCommentaryDisplay(ai?.detailed_text),
    [ai?.detailed_text],
  )

  if (!open || !row) return null

  const dv = fluxDisplayVariance(row)
  const conciseText = cleanAiText(ai?.edited_text || ai?.concise_text)
  const hasDetailed = sections.length > 0
  const signed = sign && !sign.is_stale
  const statusMeta = status ? REVIEW_STATUS_META[status] : null

  const footer = (
    <>
      <AppButton variant="ghost" size="md" onClick={onClose}>Close</AppButton>
      {canSignOff(role) ? (
        signed ? (
          <AppButton
            variant="outline"
            size="md"
            iconLeft={<CheckCircle2 size={16} strokeWidth={2.25} />}
            onClick={() => onClear(row.caption)}
          >
            Clear sign-off
          </AppButton>
        ) : (
          <AppButton
            variant="primary"
            size="md"
            iconLeft={<CheckCircle2 size={16} strokeWidth={2.25} />}
            onClick={() => onSign(row.caption)}
          >
            Sign Off Caption
          </AppButton>
        )
      ) : null}
    </>
  )

  return (
    <AppDrawer
      open={open}
      wide
      onClose={onClose}
      title={row.caption}
      subtitle={statusMeta ? statusMeta.label : undefined}
      className="flux-detail-drawer"
      footer={footer}
    >
      <div className="flux-detail">
        {/* Summary band */}
        <div className="flux-detail__summary">
          <div className="flux-detail__badges">
            {row.is_material ? <AppBadge variant="danger">Material</AppBadge> : null}
            {statusMeta ? <AppBadge variant={statusMeta.badge}>{statusMeta.label}</AppBadge> : null}
            {ai?.edited_text ? (
              <AppBadge variant="info">
                <PenLine size={12} strokeWidth={2.25} /> Edited
              </AppBadge>
            ) : ai ? (
              <AppBadge variant="primary">
                <Sparkles size={12} strokeWidth={2.25} /> AI
              </AppBadge>
            ) : null}
          </div>

          <div className="flux-detail__metrics">
            <DetailMetric label="Current" value={ff(Number(row.current_value || 0))} tone="neutral" />
            <DetailMetric label="Comparison" value={ff(Number(row.comp_value || 0))} tone="muted" />
            <DetailMetric
              label="Variance"
              value={ff(dv.amount)}
              tone={dv.positive ? 'success' : 'danger'}
            />
            <DetailMetric
              label="%"
              value={`${(dv.pct ?? 0).toFixed(1)}%`}
              tone={dv.positive ? 'success' : 'danger'}
            />
          </div>
        </div>

        {/* Reviewer edit callout */}
        {ai?.edited_text ? (
          <div className="flux-detail__edit-callout">
            <div className="flux-detail__edit-callout-head">
              <PenLine size={14} strokeWidth={2.25} />
              <strong>Reviewer edit</strong>
              {ai.editor ? <span>{U.mid} {ai.editor.name}</span> : null}
              {ai.edited_at ? <span>{U.mid} {fmtD(ai.edited_at)}</span> : null}
            </div>
            <p className="flux-detail__edit-callout-text">{cleanAiText(ai.edited_text)}</p>
          </div>
        ) : null}

        {/* AI action row */}
        <div className="flux-detail__ai-actions">
          {canGenerateAi(role) ? (
            <AppButton
              variant="outline"
              size="sm"
              loading={generating}
              iconLeft={<RotateCw size={14} strokeWidth={2.25} />}
              onClick={() => onGenerateAi(row.caption)}
            >
              {ai ? 'Regenerate AI' : 'Generate AI'}
            </AppButton>
          ) : null}
          {canEditAi(role) && ai ? (
            <AppButton
              variant="ghost"
              size="sm"
              iconLeft={<PenLine size={14} strokeWidth={2.25} />}
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? 'Cancel edit' : 'Edit commentary'}
            </AppButton>
          ) : null}
        </div>

        {/* Inline edit */}
        {editing ? (
          <div className="flux-detail__edit">
            <FormField label="Commentary" htmlFor="flux-detail-edit">
              <FormTextField
                id="flux-detail-edit"
                multiline
                rows={6}
                fullWidth
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Edit AI commentary"
              />
            </FormField>
            <div className="flux-detail__edit-actions">
              <AppButton variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</AppButton>
              <AppButton
                variant="primary"
                size="sm"
                onClick={() => { onEdit(row.caption, editText); setEditing(false) }}
              >
                Save
              </AppButton>
            </div>
          </div>
        ) : null}

        {/* Structured commentary */}
        {hasDetailed ? (
          <div className="flux-detail__sections">
            {sections.map((section) => {
              const narrative = NARRATIVE_KEYS.has(section.key)
              return (
                <article key={section.key} className="flux-detail-card">
                  <header className="flux-detail-card__head">
                    <span className="flux-detail-card__icon" aria-hidden>
                      {SECTION_ICON[section.key]}
                    </span>
                    <h3 className="flux-detail-card__title">{section.title}</h3>
                  </header>
                  {section.key === 'escalation_triggers' ? (
                    <div className="flux-detail-card__chips">
                      {section.lines.map((line, i) => {
                        const none = /no contract-level escalation/i.test(line)
                        return (
                          <span
                            key={`esc-${i}`}
                            className="flux-detail-card__chip"
                            style={{
                              display: 'inline-block',
                              background: none ? '#f1f5f9' : '#fef2f2',
                              border: `1px solid ${none ? '#e2e8f0' : '#fecaca'}`,
                              color: none ? '#475569' : '#b91c1c',
                              borderRadius: 999,
                              padding: '2px 10px',
                              margin: '2px 4px 2px 0',
                              fontSize: '0.8em',
                              fontWeight: 600,
                            }}
                          >
                            {line}
                          </span>
                        )
                      })}
                    </div>
                  ) : narrative ? (
                    <p className="flux-detail-card__narrative">{section.lines.join('\n')}</p>
                  ) : section.lines.length === 1 ? (
                    GAP_LINE_RE.test(section.lines[0]) ? (
                      <GapCard text={section.lines[0]} />
                    ) : (
                      <p className="flux-detail-card__line">{section.lines[0]}</p>
                    )
                  ) : (
                    <ul className="flux-detail-card__list">
                      {section.lines.map((line, i) =>
                        GAP_LINE_RE.test(line) ? (
                          <li key={`${section.key}-${i}`} style={{ listStyle: 'none' }}>
                            <GapCard text={line} />
                          </li>
                        ) : (
                          <li key={`${section.key}-${i}`}>{line}</li>
                        ),
                      )}
                    </ul>
                  )}
                </article>
              )
            })}
          </div>
        ) : conciseText ? (
          <article className="flux-detail-card">
            <header className="flux-detail-card__head">
              <span className="flux-detail-card__icon" aria-hidden><FileText size={15} strokeWidth={2.25} /></span>
              <h3 className="flux-detail-card__title">Commentary</h3>
            </header>
            <p className="flux-detail-card__narrative">{conciseText}</p>
          </article>
        ) : (
          <div className="flux-detail__empty">
            <Sparkles size={18} strokeWidth={2} />
            <p>No AI commentary generated yet for this caption.</p>
            {canGenerateAi(role) ? (
              <AppButton
                variant="primary"
                size="sm"
                loading={generating}
                iconLeft={<Sparkles size={14} strokeWidth={2.25} />}
                onClick={() => onGenerateAi(row.caption)}
              >
                Generate commentary
              </AppButton>
            ) : null}
          </div>
        )}

        {/* Sign-off history */}
        <article className="flux-detail-card">
          <header className="flux-detail-card__head">
            <span className="flux-detail-card__icon" aria-hidden><CheckCircle2 size={15} strokeWidth={2.25} /></span>
            <h3 className="flux-detail-card__title">Sign-off history</h3>
          </header>
          {sign ? (
            <div className={`flux-detail__signoff${sign.is_stale ? ' flux-detail__signoff--stale' : ''}`}>
              <span className={`flux-detail__signoff-avatar flux-avatar--tone-${avatarTone(sign.signer.id)}`}>
                {sign.signer.initials}
              </span>
              <div className="flux-detail__signoff-body">
                <strong>{sign.signer.name}</strong>
                <span className="flux-detail__signoff-meta">
                  {sign.is_stale ? 'Stale — commentary changed after sign-off' : 'Signed off'}
                  {' '}{U.mid} {fmtD(sign.signed_at)} {U.mid} v{sign.version}
                </span>
              </div>
              <AppBadge variant={sign.is_stale ? 'warning' : 'success'}>
                {sign.is_stale ? 'Stale' : 'Signed'}
              </AppBadge>
            </div>
          ) : (
            <p className="flux-detail-card__line flux-detail-card__line--muted">
              Not signed off yet.
            </p>
          )}
        </article>

        {/* Comments thread */}
        <FluxDrawerComments entityId={entityId} caption={row.caption} role={role} />
      </div>
    </AppDrawer>
  )
}

function DetailMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'neutral' | 'muted' | 'success' | 'danger'
}) {
  return (
    <div className="flux-detail-metric">
      <span className="flux-detail-metric__label">{label}</span>
      <span className={`flux-detail-metric__value flux-detail-metric__value--${tone}`}>{value}</span>
    </div>
  )
}

function FluxDrawerComments({
  entityId,
  caption,
  role,
}: {
  entityId: string
  caption: string
  role: Role
}) {
  const { data: comments = [] } = useComments(entityId, caption)
  const addComment = useAddComment()
  const resolveC = useResolveComment()
  const [draft, setDraft] = useState('')

  const submit = () => {
    if (!draft.trim()) return
    addComment.mutate({ entityId, caption, text: draft }, { onSuccess: () => setDraft('') })
  }

  return (
    <article className="flux-detail-card">
      <header className="flux-detail-card__head">
        <span className="flux-detail-card__icon" aria-hidden><MessageSquare size={15} strokeWidth={2.25} /></span>
        <h3 className="flux-detail-card__title">Comments</h3>
        <span className="flux-detail-card__count">{comments.length}</span>
      </header>

      <div className="flux-detail__comments">
        {comments.length === 0 ? (
          <p className="flux-detail-card__line flux-detail-card__line--muted">
            No comments yet {U.mdash} start the discussion below.
          </p>
        ) : null}
        {comments.map((c: CommentT) => (
          <div
            key={c.id}
            className={`flux-detail-comment${c.is_resolved ? ' flux-detail-comment--resolved' : ' flux-detail-comment--open'}`}
          >
            <div className="flux-detail-comment__head">
              <span className={`flux-detail-comment__avatar flux-avatar--tone-${avatarTone(c.user.id)}`}>
                {c.user.initials}
              </span>
              <strong>{c.user.name}</strong>
              <span className="flux-detail-comment__date">{fmtD(c.created_at)}</span>
              {!c.is_resolved && role !== 'analyst' ? (
                <AppButton
                  variant="ghost"
                  size="sm"
                  className="flux-detail-comment__resolve"
                  onClick={() => resolveC.mutate({ entityId, commentId: c.id })}
                >
                  Resolve
                </AppButton>
              ) : null}
              {c.is_resolved ? <ScrollText size={13} strokeWidth={2} aria-hidden /> : null}
            </div>
            <p className="flux-detail-comment__text">{c.text}</p>
            {c.replies && c.replies.length > 0 ? (
              <div className="flux-detail-comment__replies">
                {c.replies.map((rep) => (
                  <div key={rep.id}>
                    <strong>{rep.user.initials}</strong> {rep.text}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flux-detail__comment-input-row">
        <input
          className="flux-detail__comment-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Add comment${U.ellip}`}
          aria-label="Add comment"
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
        />
        <AppButton variant="primary" size="sm" disabled={!draft.trim()} onClick={submit}>
          Send
        </AppButton>
      </div>
    </article>
  )
}
