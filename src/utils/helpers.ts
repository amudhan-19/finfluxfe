// @author  veera
// @file    utils/helpers.ts

import { X } from '@/constants/theme'

export const ff = (n: number): string =>
  (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString()

export const fmtD = (d?: string | null): string => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Material-style full date: "Jun 10, 2026". */
export const fmtDFull = (d?: string | null): string => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

/** Weekday + full date: "Wed, Jun 10, 2026". */
export const fmtDLong = (d?: string | null): string => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

/** Inclusive range, collapsing a shared year: "Jun 1 – Jun 30, 2026". */
export const fmtDateRange = (start: Date, end: Date): string => {
  const sameYear = start.getFullYear() === end.getFullYear()
  const left = start.toLocaleDateString(
    'en-US',
    sameYear
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' },
  )
  const right = end.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  return `${left} \u2013 ${right}`
}

/** Human due phrase: "Due today" / "Due in 3 days" / "Overdue by 2 days". */
export const duePhrase = (d?: string | null): string => {
  if (!d) return 'No due date'
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 864e5)
  if (diff < 0) {
    const n = Math.abs(diff)
    return `Overdue by ${n} day${n === 1 ? '' : 's'}`
  }
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  return `Due in ${diff} days`
}

export interface DueInfo {
  l: string
  c: string
  bg: string
  over?: boolean
}

export const dueInfo = (d?: string | null): DueInfo => {
  if (!d) return { l: '—', c: X.textM, bg: X.cardAlt }
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 864e5)
  if (diff < 0)  return { l: `${Math.abs(diff)}d over`, c: X.red,   bg: X.redL,   over: true }
  if (diff <= 3) return { l: `${diff}d left`,           c: X.amber, bg: X.amberL }
  return                { l: `${diff}d`,                c: X.green, bg: X.greenL }
}

export const nowStr = (): string =>
  new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })

export const isBold = (c: string): boolean =>
  c.startsWith('Total') ||
  ['Revenue', 'Gross Profit', 'Operating Income', 'Net Income', 'Equity'].includes(c)
