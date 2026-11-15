// @author  veera
// @file    components/shared/MonthPicker.tsx
//
// Multi-month picker used by Flux Settings -> Period Config.
// Stores values as "YYYY-MM" strings; emits an array (multi) or a single
// string (single mode). Spans years via prev/next year buttons.

import { useState } from 'react'
import ChevronLeftOutlined from '@mui/icons-material/ChevronLeftOutlined'
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatMonthSummary(values: string[]): string {
  if (values.length === 0) return ''
  return values
    .map((v) => {
      const [y, m] = v.split('-')
      const mi = parseInt(m, 10) - 1
      if (Number.isNaN(mi) || mi < 0 || mi > 11 || !y) return v
      return `${MONTH_NAMES[mi]} ${y}`
    })
    .join(', ')
}

interface Props {
  label: string
  value: string[]
  multi?: boolean
  onChange: (v: string[]) => void
  className?: string
}

export default function MonthPicker({ label, value, multi = true, onChange, className = '' }: Props) {
  const [year, setYear] = useState<number>(() => {
    const v = value.find(Boolean)
    if (v) {
      const y = parseInt(v.slice(0, 4), 10)
      if (!Number.isNaN(y)) return y
    }
    return new Date().getFullYear()
  })

  const toggle = (key: string) => {
    if (multi) {
      const set = new Set(value)
      if (set.has(key)) set.delete(key)
      else set.add(key)
      onChange(Array.from(set).sort())
    } else {
      onChange(value[0] === key ? [] : [key])
    }
  }

  const summary = formatMonthSummary(value)
  const rootClass = ['month-picker', className].filter(Boolean).join(' ')
  const panelId = `month-picker-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className={rootClass}>
      <div className="month-picker__header">
        <span className="month-picker__label">{label}</span>
        <span className="month-picker__summary" aria-live="polite">
          {summary || <em className="month-picker__summary-empty">none selected</em>}
        </span>
      </div>

      <div className="month-picker__panel" id={panelId}>
        <div className="month-picker__year-bar">
          <button
            type="button"
            className="month-picker__nav-btn"
            onClick={() => setYear(year - 1)}
            aria-label={`Previous year, currently ${year}`}
          >
            <ChevronLeftOutlined fontSize="small" />
          </button>
          <strong className="month-picker__year">{year}</strong>
          <button
            type="button"
            className="month-picker__nav-btn"
            onClick={() => setYear(year + 1)}
            aria-label={`Next year, currently ${year}`}
          >
            <ChevronRightOutlined fontSize="small" />
          </button>
        </div>

        <div className="month-picker__grid" role="group" aria-label={`${label} months for ${year}`}>
          {MONTH_NAMES.map((m, i) => {
            const key = `${year}-${String(i + 1).padStart(2, '0')}`
            const selected = value.includes(key)
            return (
              <button
                key={key}
                type="button"
                className={[
                  'month-picker__month',
                  selected ? 'month-picker__month--selected' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => toggle(key)}
                aria-pressed={selected}
                aria-label={`${m} ${year}${selected ? ', selected' : ''}`}
              >
                {m}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** Alias for settings period config — same component, explicit naming. */
export { MonthPicker as PeriodMonthSelector }
