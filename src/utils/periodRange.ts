// @author  veera
// @file    utils/periodRange.ts
//
// Compact period storage keys for Supervisor → Flux Settings → Period Config.
// Matches backend ``build_period_range_key`` / ``expand_period_range_key``.

const MONTH_KEY_RE = /^\d{4}-\d{2}$/
const RANGE_KEY_RE = /^(\d{4}-\d{2})\.\.(\d{4}-\d{2})$/

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export interface ParsedPeriodRange {
  startDate: string
  endDate: string
  label: string
  months: string[]
}

function monthBounds(key: string): { start: string; end: string } | null {
  if (!MONTH_KEY_RE.test(key)) return null
  const [y, m] = key.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  const mm = String(m).padStart(2, '0')
  return {
    start: `${y}-${mm}-01`,
    end: `${y}-${mm}-${String(lastDay).padStart(2, '0')}`,
  }
}

function expandMonthSpan(startKey: string, endKey: string): string[] {
  const start = monthBounds(startKey)
  const end = monthBounds(endKey)
  if (!start || !end) return []

  const months: string[] = []
  let y = parseInt(startKey.slice(0, 4), 10)
  let m = parseInt(startKey.slice(5, 7), 10)
  const endY = parseInt(endKey.slice(0, 4), 10)
  const endM = parseInt(endKey.slice(5, 7), 10)

  while (y < endY || (y === endY && m <= endM)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`)
    m += 1
    if (m > 12) {
      y += 1
      m = 1
    }
  }
  return months
}

/** Validate, dedupe, and sort ``YYYY-MM`` month keys. */
export function normalizeSelectedMonths(months: string[]): string[] {
  const valid = months.filter((m) => MONTH_KEY_RE.test(m))
  return [...new Set(valid)].sort()
}

/** Build a compact storage key that fits ``VARCHAR(20)``. */
export function buildPeriodRangeKey(months: string[]): string {
  const normalized = normalizeSelectedMonths(months)
  if (normalized.length === 0) return ''
  if (normalized.length === 1) return normalized[0]
  return `${normalized[0]}..${normalized[normalized.length - 1]}`
}

/** Expand a stored key / legacy CSV / label back into month keys. */
export function parsePeriodRangeKey(value: string | null | undefined): string[] {
  const raw = (value || '').trim()
  if (!raw) return []

  const rangeMatch = RANGE_KEY_RE.exec(raw)
  if (rangeMatch) {
    return expandMonthSpan(rangeMatch[1], rangeMatch[2])
  }

  if (MONTH_KEY_RE.test(raw)) return [raw]

  const tokens = raw.split(',').map((t) => t.trim()).filter(Boolean)
  const months = new Set<string>()
  for (const token of tokens) {
    const rm = RANGE_KEY_RE.exec(token)
    if (rm) {
      expandMonthSpan(rm[1], rm[2]).forEach((m) => months.add(m))
      continue
    }
    if (MONTH_KEY_RE.test(token)) {
      months.add(token)
      continue
    }
    // Legacy display label: "Mar 2026"
    const labelMatch = /^([A-Za-z]{3,9})\s+(\d{4})$/.exec(token)
    if (labelMatch) {
      const idx = MONTH_NAMES.findIndex(
        (n) => n.toLowerCase() === labelMatch[1].slice(0, 3).toLowerCase(),
      )
      if (idx >= 0) {
        months.add(`${labelMatch[2]}-${String(idx + 1).padStart(2, '0')}`)
      }
    }
  }
  return [...months].sort()
}

function formatMonthLabel(key: string): string {
  const y = key.slice(0, 4)
  const m = parseInt(key.slice(5, 7), 10)
  return `${MONTH_NAMES[m - 1]} ${y}`
}

/** Render a finance-friendly label for a stored period key. */
export function periodRangeLabel(value: string | null | undefined): string {
  const months = parsePeriodRangeKey(value)
  if (months.length === 0) return value || ''
  if (months.length === 1) return formatMonthLabel(months[0])
  return `${formatMonthLabel(months[0])} - ${formatMonthLabel(months[months.length - 1])}`
}

/** Parse a stored key into start/end dates and a display label. */
export function parsePeriodRange(value: string | null | undefined): ParsedPeriodRange | null {
  const months = parsePeriodRangeKey(value)
  if (months.length === 0) return null
  const first = monthBounds(months[0])
  const last = monthBounds(months[months.length - 1])
  if (!first || !last) return null
  return {
    startDate: first.start,
    endDate: last.end,
    label: periodRangeLabel(value),
    months,
  }
}
