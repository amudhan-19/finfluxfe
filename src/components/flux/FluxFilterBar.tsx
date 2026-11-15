// @author  veera
// @file    components/flux/FluxFilterBar.tsx
//
// Strong filter toolbar for the Flux Review screen. Pure presentational —
// fully controlled by the parent through `filters` + `onChange`. No data
// fetching and no business logic lives here.

import type { ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  MessageSquare,
  PenLine,
  Search,
  Signature,
  Sparkles,
  X,
} from 'lucide-react'
import {
  REVIEW_STATUS_META,
  REVIEW_STATUS_ORDER,
  activeFilterCount,
  type AiSource,
  type FluxFilterState,
  type ReviewStatus,
  type VarianceSign,
} from '@/utils/fluxReviewFilters'

export type FluxFilterBarProps = {
  filters: FluxFilterState
  onChange: (patch: Partial<FluxFilterState>) => void
  onReset: () => void
  /** Per-status counts (across all rows, pre-filter) for chip badges. */
  statusCounts: Record<ReviewStatus, number>
  resultCount: number
  totalCount: number
}

function toggleStatus(current: ReviewStatus[], status: ReviewStatus): ReviewStatus[] {
  return current.includes(status)
    ? current.filter((s) => s !== status)
    : [...current, status]
}

function cycleVariance(current: VarianceSign, target: Exclude<VarianceSign, 'all'>): VarianceSign {
  return current === target ? 'all' : target
}

function cycleAiSource(current: AiSource, target: Exclude<AiSource, 'all'>): AiSource {
  return current === target ? 'all' : target
}

export function FluxFilterBar({
  filters,
  onChange,
  onReset,
  statusCounts,
  resultCount,
  totalCount,
}: FluxFilterBarProps) {
  const active = activeFilterCount(filters)

  return (
    <section className="flux-filter" aria-label="Flux review filters">
      <div className="flux-filter__row flux-filter__row--primary">
        <div className="flux-filter__search">
          <Search size={15} strokeWidth={2} className="flux-filter__search-icon" aria-hidden />
          <input
            type="search"
            className="flux-filter__search-input"
            value={filters.search}
            placeholder="Search caption or account…"
            aria-label="Search caption or account"
            onChange={(e) => onChange({ search: e.target.value })}
          />
        </div>

        <div className="flux-filter__toggles" role="group" aria-label="Quick filters">
          <FilterToggle
            active={filters.materialOnly}
            icon={<AlertTriangle size={14} strokeWidth={2.25} />}
            label="Material only"
            tone="danger"
            onClick={() => onChange({ materialOnly: !filters.materialOnly })}
          />
          <FilterToggle
            active={filters.withComments}
            icon={<MessageSquare size={14} strokeWidth={2.25} />}
            label="With comments"
            tone="info"
            onClick={() => onChange({ withComments: !filters.withComments })}
          />
          <FilterToggle
            active={filters.unsignedOnly}
            icon={<Signature size={14} strokeWidth={2.25} />}
            label="Unsigned only"
            tone="warning"
            onClick={() => onChange({ unsignedOnly: !filters.unsignedOnly })}
          />
          <FilterToggle
            active={filters.variance === 'positive'}
            icon={<ArrowUpRight size={14} strokeWidth={2.25} />}
            label="Positive"
            tone="success"
            onClick={() => onChange({ variance: cycleVariance(filters.variance, 'positive') })}
          />
          <FilterToggle
            active={filters.variance === 'negative'}
            icon={<ArrowDownRight size={14} strokeWidth={2.25} />}
            label="Negative"
            tone="danger"
            onClick={() => onChange({ variance: cycleVariance(filters.variance, 'negative') })}
          />
          <FilterToggle
            active={filters.aiSource === 'ai'}
            icon={<Sparkles size={14} strokeWidth={2.25} />}
            label="AI generated"
            tone="primary"
            onClick={() => onChange({ aiSource: cycleAiSource(filters.aiSource, 'ai') })}
          />
          <FilterToggle
            active={filters.aiSource === 'edited'}
            icon={<PenLine size={14} strokeWidth={2.25} />}
            label="Manually edited"
            tone="info"
            onClick={() => onChange({ aiSource: cycleAiSource(filters.aiSource, 'edited') })}
          />
        </div>

        <div className="flux-filter__meta">
          <span className="flux-filter__result-count">
            <Filter size={13} strokeWidth={2} aria-hidden />
            {resultCount}/{totalCount}
          </span>
          {active > 0 ? (
            <button type="button" className="flux-filter__clear" onClick={onReset}>
              <X size={13} strokeWidth={2.25} aria-hidden />
              Clear ({active})
            </button>
          ) : null}
        </div>
      </div>

      <div className="flux-filter__row flux-filter__row--status" role="group" aria-label="Review status">
        <span className="flux-filter__status-label">Status</span>
        {REVIEW_STATUS_ORDER.map((status) => {
          const meta = REVIEW_STATUS_META[status]
          const selected = filters.statuses.includes(status)
          return (
            <button
              key={status}
              type="button"
              aria-pressed={selected}
              className={[
                'flux-status-chip',
                `flux-status-chip--${meta.modifier}`,
                selected ? 'flux-status-chip--active' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onChange({ statuses: toggleStatus(filters.statuses, status) })}
            >
              <span className="flux-status-chip__dot" aria-hidden />
              {meta.label}
              <span className="flux-status-chip__count">{statusCounts[status] ?? 0}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function FilterToggle({
  active,
  icon,
  label,
  tone,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  label: string
  tone: 'primary' | 'success' | 'danger' | 'warning' | 'info'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={[
        'flux-filter-toggle',
        `flux-filter-toggle--${tone}`,
        active ? 'flux-filter-toggle--active' : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      <span className="flux-filter-toggle__icon" aria-hidden>{icon}</span>
      {label}
    </button>
  )
}
