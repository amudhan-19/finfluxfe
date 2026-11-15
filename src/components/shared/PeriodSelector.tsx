// @author  veera
// @file    components/shared/PeriodSelector.tsx
//
// Financial period builder used by Flux Settings → Period Config. Pure
// presentation over a `string[]` of "YYYY-MM" keys — identical data shape to
// the previous MonthPicker, so the stored payload and save/generate behaviour
// are unchanged. Adds per-section year navigation, Select All / Clear All,
// quarter quick-select, and a live finance-friendly range preview.

import { useState } from 'react'
import ChevronLeftOutlined from '@mui/icons-material/ChevronLeftOutlined'
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined'
import { buildPeriodRangeKey, parsePeriodRange } from '@/utils/periodRange'
import { U } from '@/constants/uiText'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const QUARTERS: { id: string; months: number[] }[] = [
  { id: 'Q1', months: [1, 2, 3] },
  { id: 'Q2', months: [4, 5, 6] },
  { id: 'Q3', months: [7, 8, 9] },
  { id: 'Q4', months: [10, 11, 12] },
]

type QuarterState = 'empty' | 'partial' | 'full'

export function PeriodSelector({
  title,
  tone,
  value,
  onChange,
  idBase,
}: {
  title: string
  tone: 'current' | 'comparison'
  value: string[]
  onChange: (next: string[]) => void
  idBase: string
}) {
  const [year, setYear] = useState<number>(() => {
    const first = value.find(Boolean)
    const parsed = first ? parseInt(first.slice(0, 4), 10) : NaN
    return Number.isNaN(parsed) ? new Date().getFullYear() : parsed
  })

  const monthKey = (month: number) => `${year}-${String(month).padStart(2, '0')}`
  const yearMonthKeys = Array.from({ length: 12 }, (_, i) => monthKey(i + 1))

  const commit = (set: Set<string>) => onChange([...set].sort())

  const toggleMonth = (key: string) => {
    const set = new Set(value)
    if (set.has(key)) set.delete(key)
    else set.add(key)
    commit(set)
  }

  // Select All adds the 12 months of the displayed year (preserving any
  // selections in other years within this same section).
  const selectAll = () => {
    const set = new Set(value)
    yearMonthKeys.forEach((k) => set.add(k))
    commit(set)
  }

  // Clear All removes every month in this section only.
  const clearAll = () => onChange([])

  const quarterStateFor = (months: number[]): QuarterState => {
    const keys = months.map(monthKey)
    const selected = keys.filter((k) => value.includes(k)).length
    if (selected === 0) return 'empty'
    if (selected === keys.length) return 'full'
    return 'partial'
  }

  const toggleQuarter = (months: number[]) => {
    const keys = months.map(monthKey)
    const allSelected = keys.every((k) => value.includes(k))
    const set = new Set(value)
    if (allSelected) keys.forEach((k) => set.delete(k))
    else keys.forEach((k) => set.add(k))
    commit(set)
  }

  const count = value.length
  const range = parsePeriodRange(buildPeriodRangeKey(value))
  const gridLabel = `${title} months for ${year}`

  return (
    <div className={`flux-period-config__period-card flux-period-config__period-card--${tone}`}>
      <div className="flux-period-config__period-header">
        <div className="flux-period-config__period-title-wrap">
          <span className="flux-period-config__period-title">{title}</span>
          <span className="flux-period-config__period-count">
            {count} month{count === 1 ? '' : 's'} selected
          </span>
        </div>
        <div className="flux-period-config__year-nav">
          <button
            type="button"
            className="flux-period-config__year-btn"
            onClick={() => setYear((y) => y - 1)}
            aria-label={`Previous year, currently ${year}`}
          >
            <ChevronLeftOutlined fontSize="small" />
          </button>
          <span className="flux-period-config__year">{year}</span>
          <button
            type="button"
            className="flux-period-config__year-btn"
            onClick={() => setYear((y) => y + 1)}
            aria-label={`Next year, currently ${year}`}
          >
            <ChevronRightOutlined fontSize="small" />
          </button>
        </div>
      </div>

      <div className="flux-period-config__quick-actions">
        <button
          type="button"
          className="flux-period-config__quick-btn"
          onClick={selectAll}
        >
          Select All
        </button>
        <button
          type="button"
          className="flux-period-config__quick-btn flux-period-config__quick-btn--ghost"
          onClick={clearAll}
          disabled={count === 0}
        >
          Clear All
        </button>
      </div>

      <div className="flux-period-config__quarter-row" role="group" aria-label={`${title} quarters for ${year}`}>
        {QUARTERS.map((q) => {
          const state = quarterStateFor(q.months)
          return (
            <button
              key={q.id}
              type="button"
              className={`flux-period-config__quarter-chip flux-period-config__quarter-chip--${state}`}
              onClick={() => toggleQuarter(q.months)}
              aria-pressed={state === 'full'}
              title={`Toggle ${q.id} (${q.months.map((m) => MONTH_NAMES[m - 1]).join(', ')} ${year})`}
            >
              {q.id}
            </button>
          )
        })}
      </div>

      <div className="flux-period-config__month-grid" role="group" aria-label={gridLabel}>
        {MONTH_NAMES.map((m, i) => {
          const key = monthKey(i + 1)
          const selected = value.includes(key)
          return (
            <button
              key={key}
              id={`${idBase}-${key}`}
              type="button"
              className={[
                'flux-period-config__month-button',
                selected ? 'flux-period-config__month-button--selected' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => toggleMonth(key)}
              aria-pressed={selected}
              aria-label={`${m} ${year}${selected ? ', selected' : ''}`}
            >
              {m}
            </button>
          )
        })}
      </div>

      <div className="flux-period-config__preview">
        {range ? (
          <>
            <span className="flux-period-config__preview-label">{range.label}</span>
            <span className="flux-period-config__preview-dates">
              {range.startDate} {U.arr} {range.endDate}
            </span>
          </>
        ) : (
          <span className="flux-period-config__preview-empty">No months selected yet</span>
        )}
      </div>
    </div>
  )
}

export default PeriodSelector
