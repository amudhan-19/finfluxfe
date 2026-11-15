// @author  veera
// @file    components/flux/ReviewQueue.tsx
//
// Review Queue landing (shown when no entity is selected in Flux Review).
// Pure presentation over the existing entity list payload — summary KPIs,
// filter toolbar, high-signal entity cards with a review-progress ring, and
// client-side pagination + CSV export. No API contract or business logic is
// changed; `review_progress` is additive metadata that safely defaults to 0.

import { useMemo, useState, type ReactNode } from 'react'
import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined'
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined'
import EventBusyOutlined from '@mui/icons-material/EventBusyOutlined'
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined'
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined'
import TodayOutlined from '@mui/icons-material/TodayOutlined'
import DateRangeOutlined from '@mui/icons-material/DateRangeOutlined'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { PageHeader } from '@/components/ui/PageHeader'
import { WF } from '@/constants/theme'
import { U } from '@/constants/uiText'
import { fmtD, fmtDFull } from '@/utils/helpers'
import type { EntityListItem, Role } from '@/types/models'

type SortKey =
  | 'overdue_desc'
  | 'overdue_asc'
  | 'name'
  | 'progress_desc'
  | 'progress_asc'

const PAGE_SIZES = [10, 25, 50]

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'wip', label: 'WIP' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'pending_director', label: 'Pending Director' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'YoY', label: 'YoY' },
  { value: 'MoM', label: 'MoM' },
  { value: 'QoQ', label: 'QoQ' },
  { value: 'Custom', label: 'Custom' },
]

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'overdue_desc', label: 'Overdue (high to low)' },
  { value: 'overdue_asc', label: 'Overdue (low to high)' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'progress_desc', label: 'Progress (high to low)' },
  { value: 'progress_asc', label: 'Progress (low to high)' },
]

const ROLE_LABELS: Record<Role, string> = {
  analyst: 'Analyst',
  supervisor: 'Supervisor',
  director: 'Director',
  admin: 'Admin',
}

function statusBadgeVariant(
  status: string,
): 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' {
  switch (status) {
    case 'approved': return 'success'
    case 'under_review': return 'warning'
    case 'rejected': return 'danger'
    case 'wip': return 'info'
    case 'pending_director': return 'primary'
    default: return 'neutral'
  }
}

function avatarTone(seed: string | number): number {
  const n = typeof seed === 'number' ? seed : seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return n % 6
}

/** Whole days from now until a date string (negative = past). */
function daysUntil(d?: string | null): number | null {
  if (!d) return null
  return Math.ceil((new Date(d).getTime() - Date.now()) / 864e5)
}

type DueTone = 'over' | 'today' | 'soon' | 'ok' | 'done' | 'none'

function queueDue(e: EntityListItem): { tone: DueTone; main: string; sub: string } {
  if (e.status === 'approved') {
    return { tone: 'done', main: 'Completed', sub: fmtDFull(e.rev_due_date || e.sub_due_date) }
  }
  const days = daysUntil(e.sub_due_date)
  if (days === null) return { tone: 'none', main: 'No due date', sub: '' }
  if (days < 0) {
    const n = Math.abs(days)
    return { tone: 'over', main: `${n} day${n === 1 ? '' : 's'} overdue`, sub: fmtDFull(e.sub_due_date) }
  }
  if (days === 0) return { tone: 'today', main: 'Due today', sub: fmtDFull(e.sub_due_date) }
  return {
    tone: days <= 7 ? 'soon' : 'ok',
    main: `Due in ${days} day${days === 1 ? '' : 's'}`,
    sub: fmtDFull(e.sub_due_date),
  }
}

function ringTone(pct: number): 'over' | 'mid' | 'ok' {
  if (pct >= 70) return 'ok'
  if (pct >= 40) return 'mid'
  return 'over'
}

function csvCell(value: string | number): string {
  const s = String(value ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function exportCsv(rows: EntityListItem[]): void {
  const header = [
    'Entity', 'Region', 'Type', 'Status',
    'Current Period', 'Comparison Period', 'Sub. Due', 'Progress %',
  ]
  const body = rows.map((e) => [
    e.name,
    e.region,
    e.period_type,
    WF[(e.status as keyof typeof WF) || 'assigned']?.l ?? e.status,
    e.period_from_label || e.period_from,
    e.period_to_label || e.period_to,
    fmtD(e.sub_due_date),
    e.review_progress ?? 0,
  ])
  const csv = [header, ...body].map((r) => r.map(csvCell).join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `review-queue-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function ReviewQueue({
  entities,
  onOpen,
}: {
  entities: EntityListItem[]
  onOpen: (entityId: string) => void
}) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [region, setRegion] = useState('')
  const [type, setType] = useState('')
  const [sort, setSort] = useState<SortKey>('overdue_desc')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const regionOptions = useMemo(() => {
    const set = new Set(entities.map((e) => e.region))
    return [{ value: '', label: 'All regions' }, ...[...set].map((r) => ({ value: r, label: r }))]
  }, [entities])

  // Summary always reflects the full visible set (independent of filters).
  const summary = useMemo(() => {
    let overdue = 0, dueToday = 0, dueWeek = 0, onTrack = 0, completed = 0
    entities.forEach((e) => {
      if (e.status === 'approved') { completed += 1; return }
      const days = daysUntil(e.sub_due_date)
      if (days === null) { onTrack += 1; return }
      if (days < 0) overdue += 1
      else if (days === 0) dueToday += 1
      else if (days <= 7) dueWeek += 1
      else onTrack += 1
    })
    return { total: entities.length, overdue, dueToday, dueWeek, onTrack, completed }
  }, [entities])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = entities.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q) && !e.id.toLowerCase().includes(q)) return false
      if (status && e.status !== status) return false
      if (region && e.region !== region) return false
      if (type && e.period_type !== type) return false
      return true
    })
    const byOverdue = (e: EntityListItem) => {
      const d = daysUntil(e.sub_due_date)
      return d === null ? Number.POSITIVE_INFINITY : d
    }
    const sorted = [...list]
    switch (sort) {
      case 'overdue_desc': sorted.sort((a, b) => byOverdue(a) - byOverdue(b)); break
      case 'overdue_asc': sorted.sort((a, b) => byOverdue(b) - byOverdue(a)); break
      case 'name': sorted.sort((a, b) => a.name.localeCompare(b.name)); break
      case 'progress_desc': sorted.sort((a, b) => (b.review_progress ?? 0) - (a.review_progress ?? 0)); break
      case 'progress_asc': sorted.sort((a, b) => (a.review_progress ?? 0) - (b.review_progress ?? 0)); break
    }
    return sorted
  }, [entities, search, status, region, type, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const start = safePage * pageSize
  const pageRows = filtered.slice(start, start + pageSize)
  const rangeStart = filtered.length === 0 ? 0 : start + 1
  const rangeEnd = Math.min(start + pageSize, filtered.length)

  const resetPage = () => setPage(0)

  return (
    <div className="review-queue">
      <PageHeader
        title="Review Queue"
        subtitle="Monitor and manage entity review progress across all regions."
        icon={<FactCheckOutlined sx={{ fontSize: 24 }} />}
        actions={(
          <AppButton
            variant="primary"
            size="sm"
            onClick={() => exportCsv(filtered)}
            disabled={filtered.length === 0}
          >
            <FileDownloadOutlined sx={{ fontSize: 17 }} />
            Export
          </AppButton>
        )}
      />

      <div className="review-queue__filters">
        <div className="review-queue__search">
          <SearchOutlined sx={{ fontSize: 18 }} className="review-queue__search-icon" />
          <input
            type="search"
            className="review-queue__search-input"
            placeholder="Search entities…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage() }}
            aria-label="Search entities"
          />
        </div>
        <div className="review-queue__filter">
          <span className="review-queue__filter-label">Status</span>
          <FilterSelect
            value={status}
            onChange={(v) => { setStatus(v); resetPage() }}
            placeholder="All statuses"
            aria-label="Filter by status"
            options={STATUS_OPTIONS}
          />
        </div>
        <div className="review-queue__filter">
          <span className="review-queue__filter-label">Review type</span>
          <FilterSelect
            value={type}
            onChange={(v) => { setType(v); resetPage() }}
            placeholder="All types"
            aria-label="Filter by review type"
            options={TYPE_OPTIONS}
          />
        </div>
        <div className="review-queue__filter">
          <span className="review-queue__filter-label">Region</span>
          <FilterSelect
            value={region}
            onChange={(v) => { setRegion(v); resetPage() }}
            placeholder="All regions"
            aria-label="Filter by region"
            options={regionOptions}
          />
        </div>
        <div className="review-queue__filter">
          <span className="review-queue__filter-label">Sort by</span>
          <FilterSelect
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            placeholder="Sort by"
            aria-label="Sort entities"
            options={SORT_OPTIONS}
          />
        </div>
      </div>

      <div className="review-queue__summary">
        <SummaryStat icon={<ApartmentOutlined sx={{ fontSize: 18 }} />} tone="neutral" label="Total Entities" value={summary.total} />
        <SummaryStat icon={<EventBusyOutlined sx={{ fontSize: 18 }} />} tone="over" label="Overdue" value={summary.overdue} />
        <SummaryStat icon={<TodayOutlined sx={{ fontSize: 18 }} />} tone="today" label="Due Today" value={summary.dueToday} />
        <SummaryStat icon={<DateRangeOutlined sx={{ fontSize: 18 }} />} tone="soon" label="Due This Week" value={summary.dueWeek} />
        <SummaryStat icon={<TrendingUpOutlined sx={{ fontSize: 18 }} />} tone="ok" label="On Track" value={summary.onTrack} />
        <SummaryStat icon={<CheckCircleOutlined sx={{ fontSize: 18 }} />} tone="done" label="Completed" value={summary.completed} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No entities match these filters."
          description="Try clearing the search or filters above."
        />
      ) : (
        <>
          <div className="review-queue__grid">
            {pageRows.map((e) => (
              <QueueCard key={e.id} entity={e} onOpen={onOpen} />
            ))}
          </div>

          <div className="review-queue__pager">
            <span className="review-queue__pager-info">
              Showing {rangeStart} to {rangeEnd} of {filtered.length} entit{filtered.length === 1 ? 'y' : 'ies'}
            </span>
            <div className="review-queue__pager-controls">
              <button
                type="button"
                className="review-queue__pager-btn"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                aria-label="Previous page"
              >
                {U.navL}
              </button>
              <span className="review-queue__pager-page">{safePage + 1}</span>
              <button
                type="button"
                className="review-queue__pager-btn"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={safePage >= pageCount - 1}
                aria-label="Next page"
              >
                {U.triRt}
              </button>
              <select
                className="review-queue__pager-size"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); resetPage() }}
                aria-label="Rows per page"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>{n} / page</option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SummaryStat({
  icon,
  tone,
  label,
  value,
}: {
  icon: ReactNode
  tone: 'neutral' | 'over' | 'today' | 'soon' | 'ok' | 'done'
  label: string
  value: number
}) {
  return (
    <div className={`review-queue__stat review-queue__stat--${tone}`}>
      <span className="review-queue__stat-icon">{icon}</span>
      <div className="review-queue__stat-body">
        <span className="review-queue__stat-label">{label}</span>
        <span className="review-queue__stat-value">{value}</span>
      </div>
    </div>
  )
}

function QueueCard({
  entity: e,
  onOpen,
}: {
  entity: EntityListItem
  onOpen: (entityId: string) => void
}) {
  const wfi = WF[(e.status as keyof typeof WF) || 'assigned']
  const due = queueDue(e)
  const pct = Math.max(0, Math.min(100, e.review_progress ?? 0))
  const lead = e.assignees?.[0]

  return (
    <button
      type="button"
      className={`review-queue__card review-queue__card--${e.status}${due.tone === 'over' ? ' review-queue__card--overdue' : ''}`}
      onClick={() => onOpen(e.id)}
    >
      <div className="review-queue__card-top">
        <div className="review-queue__card-id">
          <span className="review-queue__card-glyph" aria-hidden>
            <ApartmentOutlined sx={{ fontSize: 18 }} />
          </span>
          <div className="review-queue__card-head">
            <span className="review-queue__card-name">{e.name}</span>
            <span className="review-queue__card-sub">{e.region} {U.mid} {e.period_type}</span>
          </div>
        </div>
        <AppBadge variant={statusBadgeVariant(e.status)}>{wfi.l}</AppBadge>
      </div>

      <div className="review-queue__card-periods">
        <div className="review-queue__period">
          <span className="review-queue__period-label">Current Period</span>
          <span className="review-queue__period-val">{e.period_from_label || e.period_from}</span>
        </div>
        <span className="review-queue__period-arrow" aria-hidden>{U.arr}</span>
        <div className="review-queue__period">
          <span className="review-queue__period-label">Comparison Period</span>
          <span className="review-queue__period-val review-queue__period-val--cmp">
            {e.period_to_label || e.period_to}
          </span>
        </div>
      </div>

      <div className="review-queue__card-foot">
        <div className={`review-queue__due review-queue__due--${due.tone}`}>
          {due.tone === 'done' ? (
            <CheckCircleOutlined sx={{ fontSize: 14 }} />
          ) : (
            <EventBusyOutlined sx={{ fontSize: 14 }} />
          )}
          <span className="review-queue__due-main">{due.main}</span>
          {due.sub ? <span className="review-queue__due-sub">{due.sub}</span> : null}
        </div>

        {lead ? (
          <div className="review-queue__assignee">
            <span className={`review-queue__avatar review-queue__avatar--tone-${avatarTone(lead.id)}`}>
              {lead.initials}
            </span>
            <div className="review-queue__assignee-meta">
              <span className="review-queue__assignee-name">{lead.name}</span>
              <span className="review-queue__assignee-role">{ROLE_LABELS[lead.role] ?? lead.role}</span>
            </div>
          </div>
        ) : (
          <div className="review-queue__assignee review-queue__assignee--none">Unassigned</div>
        )}

        <ProgressRing pct={pct} approved={e.status === 'approved'} />
      </div>
    </button>
  )
}

function ProgressRing({ pct, approved }: { pct: number; approved: boolean }) {
  const radius = 15
  const circumference = 2 * Math.PI * radius
  const tone = approved ? 'ok' : ringTone(pct)
  const dash = (pct / 100) * circumference

  return (
    <div className="review-queue__ring" title={`${pct}% reviewed`}>
      <svg viewBox="0 0 40 40" width="42" height="42" aria-hidden>
        <circle className="review-queue__ring-track" cx="20" cy="20" r={radius} />
        <circle
          className={`review-queue__ring-bar review-queue__ring-bar--${tone}`}
          cx="20"
          cy="20"
          r={radius}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
        />
      </svg>
      <span className={`review-queue__ring-label review-queue__ring-label--${tone}`}>
        {approved ? U.check : `${pct}%`}
      </span>
    </div>
  )
}
