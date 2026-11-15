// @author  veera
// @file    components/flux/FluxReviewView.tsx

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ChatOutlined from '@mui/icons-material/ChatOutlined'
import ExpandLessOutlined from '@mui/icons-material/ExpandLessOutlined'
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import { useEntities, useEntity } from '@/features/entities/hooks'
import { useFlux, useAiCommentary, useEditAi, useGenerateFluxAi } from '@/features/flux/hooks'
import { useSignoffs, useSignCaption, useClearSignoff, useBulkSignoff } from '@/features/signoffs/hooks'
import { useApprove, useReject, useSubmit, useSendForApproval } from '@/features/workflow/hooks'
import { useMacroFactors } from '@/features/macro/hooks'
import { useChat, usePostMessage, useReplyMessage } from '@/features/chat/hooks'
import { useCaptionsComments } from '@/features/comments/hooks'
import { useUiStore } from '@/store/useUiStore'
import { useAuth } from '@/features/auth/AuthProvider'
import { canSignOff, canSubmitFlux } from '@/utils/rbac'
import { U } from '@/constants/uiText'
import { WF } from '@/constants/theme'
import { ff, fmtD } from '@/utils/helpers'
import { FluxReviewDataGrid } from '@/components/flux/FluxReviewDataGrid'
import { ReviewQueue } from '@/components/flux/ReviewQueue'
import { FluxFilterBar } from '@/components/flux/FluxFilterBar'
import { FluxDetailPanel } from '@/components/flux/FluxDetailPanel'
import {
  EMPTY_FLUX_FILTERS,
  deriveReviewStatus,
  matchesFluxFilters,
  type FluxFilterState,
  type ReviewStatus,
} from '@/utils/fluxReviewFilters'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { AppDrawer } from '@/components/ui/AppDrawer'
import { AppModal } from '@/components/ui/AppModal'
import * as exportApi from '@/features/export/api'
import type {
  AiCommentary,
  ChatMessage,
  Entity,
  MacroFactor,
  Role,
  Signoff,
} from '@/types/models'

const MACRO_CAT_CLASS: Record<string, string> = {
  Geopolitical: 'geopolitical',
  Energy: 'energy',
  Monetary: 'monetary',
  Regulatory: 'regulatory',
  Industry: 'industry',
  FX: 'fx',
  Conflict: 'conflict',
}

function avatarTone(seed: string | number): number {
  const n = typeof seed === 'number' ? seed : seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return n % 6
}

function statusBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' {
  switch (status) {
    case 'approved': return 'success'
    case 'under_review': return 'warning'
    case 'rejected': return 'danger'
    case 'wip': return 'info'
    case 'pending_director': return 'primary'
    default: return 'neutral'
  }
}

export default function FluxReviewView({ basePath }: { basePath: string }) {
  const { entityId: routeEntityId } = useParams<{ entityId?: string }>()
  const { setSelCo, plbs, setPlbs, toast, chatVisible, setChatVisible, aiMode, setAiMode } = useUiStore()
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { if (routeEntityId) setSelCo(routeEntityId) }, [routeEntityId, setSelCo])

  const { data: entities = [] } = useEntities()
  const { data: entity } = useEntity(routeEntityId || null)

  if (!routeEntityId) {
    return (
      <div className="flux-review flux-review--queue">
        <ReviewQueue
          entities={entities}
          onOpen={(id) => navigate(`${basePath}/flux-review/${id}`)}
        />
      </div>
    )
  }

  if (!entity) {
    return <div className="flux-review__loading">{`Loading${U.ellip}`}</div>
  }

  return (
    <FluxDetail
      entity={entity}
      plbs={plbs}
      setPlbs={setPlbs}
      toast={toast}
      role={user!.role}
      aiMode={aiMode}
      setAiMode={setAiMode}
      chatVisible={chatVisible}
      setChatVisible={setChatVisible}
    />
  )
}

interface DetailProps {
  entity: Entity
  plbs: 'pl' | 'bs'
  setPlbs: (v: 'pl' | 'bs') => void
  toast: (m: string) => void
  role: Role
  aiMode: 'concise' | 'detailed'
  setAiMode: (v: 'concise' | 'detailed') => void
  chatVisible: boolean
  setChatVisible: (v: boolean) => void
}

function FluxDetail({
  entity, plbs, setPlbs, toast, role,
  aiMode, setAiMode, chatVisible, setChatVisible,
}: DetailProps) {
  const { data: rows = [], isLoading } = useFlux(entity.id, plbs)
  const { data: ai = [] } = useAiCommentary(entity.id)
  const { data: signoffs = [] } = useSignoffs(entity.id)
  const { data: macros = [] } = useMacroFactors(entity.id)
  const aiByCap = useMemo(() => Object.fromEntries(ai.map((a: AiCommentary) => [a.caption, a])), [ai])
  const signByCap = useMemo(() => Object.fromEntries(signoffs.map((s: Signoff) => [s.caption, s])), [signoffs])

  const captions = useMemo(() => rows.map((r) => r.caption), [rows])
  const commentInfoByCap = useCaptionsComments(entity.id, captions)

  const editAi = useEditAi()
  const genAi = useGenerateFluxAi()
  const sign = useSignCaption()
  const clearS = useClearSignoff()
  const bulkSign = useBulkSignoff()
  const submit = useSubmit()
  const approve = useApprove()
  const reject = useReject()
  const sendApr = useSendForApproval()

  const wfi = WF[(entity.status as keyof typeof WF) || 'assigned']
  const [macroOpen, setMacroOpen] = useState(false)
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)
  const [filters, setFilters] = useState<FluxFilterState>(EMPTY_FLUX_FILTERS)
  const [selectedCaption, setSelectedCaption] = useState<string | null>(null)

  useEffect(() => { setSelectedCaption(null) }, [plbs])

  const onApprove = () =>
    approve.mutate({ id: entity.id }, {
      onSuccess: () => toast('Approved'),
      onError: (e: any) => toast(e?.response?.data?.detail || 'Cannot approve'),
    })

  const onReject = () => {
    const note = window.prompt('Reason for rejection?') || ''
    reject.mutate({ id: entity.id, note }, { onSuccess: () => toast('Rejected') })
  }

  const onSubmit = () =>
    submit.mutate({ id: entity.id }, { onSuccess: () => toast('Submitted for review') })

  const onSendDirector = () =>
    sendApr.mutate({ id: entity.id }, {
      onSuccess: () => toast("Sent for Director's approval"),
      onError: (e: any) => toast(e?.response?.data?.detail || 'Cannot send'),
    })

  const onExport = async () => {
    await exportApi.exportEntity(entity.id, { mode: aiMode, statement: 'both' })
    toast(`Exported ${entity.id}`)
  }

  const onBulk = () =>
    bulkSign.mutate({ entityId: entity.id, statement: plbs }, {
      onSuccess: (r) => {
        toast(`Signed off ${r.count} captions`)
        setBulkConfirmOpen(false)
      },
    })

  const onGenerateAi = (caption: string) => genAi.mutate(
    { entityId: entity.id, statement: plbs, caption },
    {
      onSuccess: (data) => {
        if (data.ok) toast(`Regenerated AI commentary for ${caption}`)
        else toast(data.safe_error_message || 'AI generation failed')
      },
      onError: (e: unknown) => {
        const err = e as { response?: { data?: { detail?: string | { safe_error_message?: string } } } }
        const detail = err?.response?.data?.detail
        const msg = typeof detail === 'string'
          ? detail
          : detail?.safe_error_message || 'AI generation failed'
        toast(msg)
      },
    },
  )

  const totals = useMemo(() => {
    let curr = 0
    let comp = 0
    let mat = 0
    let signed = 0
    rows.forEach((r) => {
      curr += Number(r.current_value || 0)
      comp += Number(r.comp_value || 0)
      if (r.is_material) mat++
      const s = signByCap[r.caption]
      if (s && !s.is_stale) signed++
    })
    const v = curr - comp
    const pct = comp ? (v / Math.abs(comp)) * 100 : 0
    return { curr, comp, v, pct, mat, signed, total: rows.length }
  }, [rows, signByCap])

  const statusCounts = useMemo(() => {
    const counts: Record<ReviewStatus, number> = {
      needs_review: 0, reviewed: 0, signed_off: 0, rejected: 0, comment_pending: 0,
    }
    rows.forEach((r) => {
      const status = deriveReviewStatus({
        row: r,
        ai: aiByCap[r.caption],
        sign: signByCap[r.caption],
        comment: commentInfoByCap[r.caption],
        entityStatus: entity.status,
      })
      counts[status] += 1
    })
    return counts
  }, [rows, aiByCap, signByCap, commentInfoByCap, entity.status])

  const resultCount = useMemo(() => rows.reduce((n, r) => {
    const status = deriveReviewStatus({
      row: r,
      ai: aiByCap[r.caption],
      sign: signByCap[r.caption],
      comment: commentInfoByCap[r.caption],
      entityStatus: entity.status,
    })
    const ok = matchesFluxFilters(filters, {
      row: r,
      ai: aiByCap[r.caption],
      sign: signByCap[r.caption],
      comment: commentInfoByCap[r.caption],
      status,
    })
    return ok ? n + 1 : n
  }, 0), [rows, filters, aiByCap, signByCap, commentInfoByCap, entity.status])

  const selectedRow = useMemo(
    () => rows.find((r) => r.caption === selectedCaption) ?? null,
    [rows, selectedCaption],
  )
  const selectedStatus = selectedRow
    ? deriveReviewStatus({
        row: selectedRow,
        ai: aiByCap[selectedRow.caption],
        sign: signByCap[selectedRow.caption],
        comment: commentInfoByCap[selectedRow.caption],
        entityStatus: entity.status,
      })
    : null

  const varClass = totals.v >= 0 ? 'flux-review__metric-value--success' : 'flux-review__metric-value--danger'
  const signedPct = totals.total ? Math.round((totals.signed / totals.total) * 100) : 0
  const stmtLabel = plbs === 'pl' ? 'P&L' : 'BS'

  return (
    <div className="flux-review">
      <div className="flux-review__main">
        <header className="flux-review__header">
          <div>
            <h1 className="flux-review__entity-title">{entity.name}</h1>
            <p className="flux-review__entity-meta">
              {entity.region} {U.mid} {entity.period_type}
            </p>
          </div>
          <AppBadge variant={statusBadgeVariant(entity.status)}>{wfi.l}</AppBadge>
          <SignOffStack signoffs={signoffs} totalCaptions={rows.length} />
          <div className="flux-review__header-actions">
            <AppButton
              variant={chatVisible ? 'outline' : 'secondary'}
              size="sm"
              iconLeft={<ChatOutlined sx={{ fontSize: 16 }} />}
              onClick={() => setChatVisible(!chatVisible)}
            >
              FinChat
            </AppButton>
            <AppButton variant="secondary" size="sm" onClick={onExport}>Export</AppButton>
            {canSubmitFlux(role) && entity.status !== 'approved' ? (
              <AppButton variant="primary" size="sm" onClick={onSubmit}>Sign Off &amp; Submit</AppButton>
            ) : null}
            {canSignOff(role) ? (
              <>
                <AppButton variant="danger" size="sm" onClick={onReject}>Reject</AppButton>
                {entity.approval_level === 'director' ? (
                  <AppButton variant="outline" size="sm" onClick={onSendDirector}>Send for Approval</AppButton>
                ) : (
                  <AppButton variant="primary" size="sm" onClick={onApprove}>Approve</AppButton>
                )}
              </>
            ) : null}
            {role === 'director' && entity.status === 'pending_director' ? (
              <AppButton variant="primary" size="sm" onClick={onApprove}>Final Approve</AppButton>
            ) : null}
          </div>
        </header>

        <div className="flux-review__period-bar">
          <span><strong>{entity.period_type}</strong></span>
          <span>Current: <strong>{entity.period_from_label || entity.period_from}</strong></span>
          <span>vs</span>
          <span>Comparison: <strong>{entity.period_to_label || entity.period_to}</strong></span>
          <FluxSourceBadge rows={rows} />
          <span className="flux-review__calc-mode">
            {plbs === 'pl' ? 'Calculated using Net Change' : 'Calculated using Balance at Date'}
          </span>
          <span className="flux-review__period-due">
            Submission due {fmtD(entity.sub_due_date)} {U.mid} Review due {fmtD(entity.rev_due_date)}
          </span>
        </div>

        <div className="flux-review__toolbar">
          <div className="flux-review__segment" role="tablist" aria-label="Statement type">
            {(['pl', 'bs'] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={plbs === s}
                className={`flux-review__segment-btn${plbs === s ? ' flux-review__segment-btn--active' : ''}`}
                onClick={() => setPlbs(s)}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>

          <MetricChip label="CURR" value={ff(totals.curr)} valueClass="flux-review__metric-value--neutral" />
          <MetricChip label="COMP" value={ff(totals.comp)} valueClass="flux-review__metric-value--muted" />
          <MetricChip label="VAR" value={ff(totals.v)} valueClass={varClass} />
          <MetricChip label="%" value={`${totals.pct.toFixed(1)}%`} valueClass={varClass} />
          <MetricChip label="MAT" value={`${totals.mat}/${totals.total}`} valueClass="flux-review__metric-value--danger" />
          <MetricChip label="SIGN" value={`${totals.signed}/${totals.total}`} valueClass="flux-review__metric-value--success" />

          <div className="flux-review__toolbar-end">
            <div className="flux-review__segment" role="tablist" aria-label="AI commentary view">
              {(['concise', 'detailed'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={aiMode === m}
                  className={`flux-review__segment-btn${aiMode === m ? ' flux-review__segment-btn--active' : ''}`}
                  onClick={() => setAiMode(m)}
                >
                  {m === 'concise' ? 'Concise' : 'Detailed'}
                </button>
              ))}
            </div>
            {canSignOff(role) ? (
              <AppButton variant="primary" size="sm" onClick={() => setBulkConfirmOpen(true)}>
                Sign Off All {stmtLabel}
              </AppButton>
            ) : null}
          </div>
        </div>

        <div className="flux-review__progress" aria-label="Sign-off progress">
          <div className="flux-review__progress-track">
            <div
              className="flux-review__progress-fill"
              style={{ width: `${signedPct}%` }}
            />
          </div>
          <span className="flux-review__progress-label">
            <strong>{totals.signed} / {totals.total}</strong> captions signed off ({signedPct}%)
          </span>
        </div>

        {macros.length > 0 ? (
          <div className="flux-review__macro-strip">
            <button
              type="button"
              className="flux-review__macro-toggle"
              onClick={() => setMacroOpen((v) => !v)}
              aria-expanded={macroOpen}
            >
              <InfoOutlined sx={{ fontSize: 18 }} />
              <strong>Macro &amp; Geopolitical</strong>
              <span className="flux-review__macro-count">
                {macros.length} factor{macros.length === 1 ? '' : 's'}
              </span>
              {macroOpen ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
            </button>
            {macroOpen ? (
              <div className="flux-review__macro-list">
                {macros.map((m: MacroFactor) => (
                  <div
                    key={m.id}
                    className={`flux-review__macro-item flux-review__macro-item--${MACRO_CAT_CLASS[m.category] || 'default'}`}
                  >
                    <span className="flux-review__macro-icon">{m.icon}</span>
                    <div className="flux-review__macro-text">
                      <strong>{m.category}</strong> {m.text}
                    </div>
                    {m.is_custom ? <AppBadge variant="info">Custom</AppBadge> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <FluxFilterBar
          filters={filters}
          onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
          onReset={() => setFilters(EMPTY_FLUX_FILTERS)}
          statusCounts={statusCounts}
          resultCount={resultCount}
          totalCount={rows.length}
        />

        <div className="flux-review__table-wrap">
          <FluxReviewDataGrid
            rows={rows}
            entityId={entity.id}
            role={role}
            aiMode={aiMode}
            aiByCap={aiByCap}
            signByCap={signByCap}
            commentInfoByCap={commentInfoByCap}
            filters={filters}
            entityStatus={entity.status}
            selectedCaption={selectedCaption}
            isLoading={isLoading}
            generatingAiCaption={genAi.isPending ? genAi.variables?.caption ?? null : null}
            onSelectRow={(caption) => setSelectedCaption(caption)}
            onSign={(caption) => sign.mutate({ entityId: entity.id, caption })}
            onClear={(caption) => clearS.mutate({ entityId: entity.id, caption })}
            onGenerateAi={onGenerateAi}
          />
        </div>
      </div>

      <FluxDetailPanel
        open={selectedRow != null}
        onClose={() => setSelectedCaption(null)}
        entityId={entity.id}
        row={selectedRow}
        ai={selectedRow ? aiByCap[selectedRow.caption] : undefined}
        sign={selectedRow ? signByCap[selectedRow.caption] : undefined}
        status={selectedStatus}
        role={role}
        generating={genAi.isPending && genAi.variables?.caption === selectedCaption}
        onSign={(caption) => sign.mutate({ entityId: entity.id, caption })}
        onClear={(caption) => clearS.mutate({ entityId: entity.id, caption })}
        onGenerateAi={onGenerateAi}
        onEdit={(caption, text) => editAi.mutate({ entityId: entity.id, caption, text })}
      />

      <FinChatDrawer entity={entity} open={chatVisible} onClose={() => setChatVisible(false)} />

      <AppModal
        open={bulkConfirmOpen}
        title="Confirm Sign Off All"
        subtitle={`Sign off all captions on the ${stmtLabel} statement for ${entity.name}?`}
        onClose={() => setBulkConfirmOpen(false)}
        secondaryAction={{ label: 'Cancel', onClick: () => setBulkConfirmOpen(false) }}
        primaryAction={{
          label: `Confirm Sign Off All ${stmtLabel}`,
          onClick: onBulk,
          loading: bulkSign.isPending,
        }}
      >
        <p className="flux-review__modal-text">
          This will apply your sign-off to all unsigned captions on the current statement.
        </p>
      </AppModal>
    </div>
  )
}

function FluxSourceBadge({ rows }: { rows: import('@/types/models').FluxRow[] }) {
  if (!rows.length) return null
  let bc = 0
  let qb = 0
  let manual = 0
  for (const r of rows) {
    const src = r.source_type ?? 'seed'
    if (src === 'business_central') bc++
    else if (src === 'quickbooks') qb++
    else if (src === 'manual') manual++
  }
  if (bc === 0 && qb === 0 && manual === 0) {
    return (
      <AppBadge variant="warning" title="Demo / seeded numbers — generate from ERP to see real data">
        SOURCE: SEED
      </AppBadge>
    )
  }
  if (qb > 0 && bc === 0) {
    return (
      <AppBadge variant="success" title="Generated from QuickBooks Online GL data">
        SOURCE: QUICKBOOKS
      </AppBadge>
    )
  }
  if (bc > 0) {
    return (
      <AppBadge variant="success" title="Generated from synced Business Central GL entries">
        SOURCE: BUSINESS CENTRAL
      </AppBadge>
    )
  }
  return (
    <AppBadge variant="info" title="Manually entered or edited flux rows">
      SOURCE: MANUAL
    </AppBadge>
  )
}

function MetricChip({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass: string
}) {
  return (
    <div className="flux-review__metric">
      <span className="flux-review__metric-label">{label}</span>
      <span className={`flux-review__metric-value ${valueClass}`}>{value}</span>
    </div>
  )
}

function SignOffStack({ signoffs, totalCaptions }: { signoffs: Signoff[]; totalCaptions: number }) {
  if (signoffs.length === 0) return null
  const stale = signoffs.some((s) => s.is_stale)
  const seen = new Map<string, Signoff>()
  signoffs.forEach((s) => { if (!seen.has(s.signer.initials)) seen.set(s.signer.initials, s) })
  const uniq = Array.from(seen.values()).slice(0, 5)

  return (
    <div className="flux-signoff-stack" title={`${signoffs.length}/${totalCaptions} captions signed`}>
      <span className={`flux-signoff-stack__label${stale ? ' flux-signoff-stack__label--stale' : ' flux-signoff-stack__label--ok'}`}>
        {stale ? 'STALE' : 'SIGNED'}
      </span>
      <div className="flux-signoff-stack__avatars">
        {uniq.map((s) => (
          <span
            key={s.signer.initials}
            title={s.signer.name}
            className={`flux-signoff-stack__avatar flux-avatar--tone-${avatarTone(s.signer.id)}${s.is_stale ? ' flux-signoff-stack__avatar--stale' : ''}`}
          >
            {s.signer.initials}
          </span>
        ))}
      </div>
      <span className="flux-signoff-stack__count">{signoffs.length}/{totalCaptions}</span>
    </div>
  )
}

function FinChatDrawer({
  entity,
  open,
  onClose,
}: {
  entity: Entity
  open: boolean
  onClose: () => void
}) {
  const { data: messages = [], isLoading } = useChat(entity.id)
  const post = usePostMessage()
  const reply = useReplyMessage()
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')

  const send = () => {
    if (!text.trim()) return
    post.mutate({ entityId: entity.id, text }, { onSuccess: () => setText('') })
  }

  const sendReply = (mid: number) => {
    if (!replyText.trim()) return
    reply.mutate({ entityId: entity.id, messageId: mid, text: replyText }, {
      onSuccess: () => { setReplyText(''); setReplyTo(null) },
    })
  }

  const replyTarget = messages.find((m) => m.id === replyTo)

  return (
    <AppDrawer
      open={open}
      title="FinChat"
      subtitle={entity.name}
      onClose={onClose}
      className="flux-chat-drawer"
      footer={(
        <>
          <input
            className="flux-chat__input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Type a message${U.ellip}`}
            aria-label="Type a message"
            onKeyDown={(e) => { if (e.key === 'Enter') send() }}
          />
          <AppButton variant="primary" size="sm" disabled={!text.trim()} onClick={send}>
            Send
          </AppButton>
        </>
      )}
    >
      {replyTo != null && replyTarget ? (
        <div className="flux-chat__reply-banner">
          <span>Replying to {replyTarget.user.name}</span>
          <AppButton variant="ghost" size="sm" onClick={() => { setReplyTo(null); setReplyText('') }}>
            Cancel
          </AppButton>
        </div>
      ) : null}

      <div className="flux-chat__messages flux-chat__messages--drawer">
        {isLoading ? <div className="flux-review__loading">{`Loading${U.ellip}`}</div> : null}
        {!isLoading && messages.length === 0 ? (
          <div className="flux-review__empty">No messages yet. Start the conversation.</div>
        ) : null}
        {messages.map((m: ChatMessage) => (
          <article key={m.id} className="flux-chat__message">
            <div className="flux-chat__message-head">
              <span className={`flux-chat__message-avatar flux-avatar--tone-${avatarTone(m.user.id)}`}>
                {m.user.initials}
              </span>
              <strong className="flux-chat__message-name">{m.user.name}</strong>
              <span className="flux-chat__message-date">{fmtD(m.created_at)}</span>
            </div>
            <p className="flux-chat__message-text">{m.text}</p>
            {m.replies && m.replies.length > 0 ? (
              <div className="flux-chat__replies">
                {m.replies.map((rep) => (
                  <div key={rep.id}>
                    <strong>{rep.user.initials}</strong> {rep.text}
                  </div>
                ))}
              </div>
            ) : null}
            {replyTo === m.id ? (
              <div className="flux-chat__reply-form">
                <input
                  className="flux-chat__reply-input"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply${U.ellip}`}
                  aria-label="Reply message"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') sendReply(m.id) }}
                />
                <AppButton variant="primary" size="sm" onClick={() => sendReply(m.id)}>Send</AppButton>
              </div>
            ) : (
              <button
                type="button"
                className="flux-chat__reply-btn"
                onClick={() => setReplyTo(m.id)}
              >
                Reply
              </button>
            )}
          </article>
        ))}
      </div>
    </AppDrawer>
  )
}
