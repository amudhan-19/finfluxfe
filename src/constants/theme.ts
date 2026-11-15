// @author  veera
// @file    constants/theme.ts
//
// Design tokens. Theme-sensitive surfaces (bg / card / borders / text / *L
// background tints) resolve to CSS variables so light & dark themes can
// flip via `<html data-theme="light|dark">`. Brand "main" colors are kept
// as plain hex strings so existing `${X.green}10` style alpha-hex
// concatenations keep working.

export const X = {
  // ── theme-sensitive ────────────────────────────────────────────────
  bg:       'var(--x-bg)',
  card:     'var(--x-card)',
  cardAlt:  'var(--x-card-alt)',
  border:   'var(--x-border)',
  borderL:  'var(--x-border-l)',
  text:     'var(--x-text)',
  textS:    'var(--x-text-s)',
  textM:    'var(--x-text-m)',
  slateL:   'var(--x-slate-l)',
  greenL:   'var(--x-green-l)',
  blueL:    'var(--x-blue-l)',
  amberL:   'var(--x-amber-l)',
  redL:     'var(--x-red-l)',
  purpleL:  'var(--x-purple-l)',
  cyanL:    'var(--x-cyan-l)',

  // ── brand main (static — used in `${X.green}10` etc) ───────────────
  green:    '#03A850',
  blue:     '#2563eb',
  amber:    '#d97706',
  red:      '#dc2626',
  purple:   '#7c3aed',
  cyan:     '#0891b2',
  slate:    '#64748b',
  white:    '#ffffff',
} as const

export const TAG_COLORS: Record<string, { c: string; bg: string }> = {
  tech:     { c: '#7c3aed', bg: 'var(--x-purple-l)' },
  priority: { c: '#dc2626', bg: 'var(--x-red-l)' },
  finance:  { c: '#2563eb', bg: 'var(--x-blue-l)' },
  emea:     { c: '#d97706', bg: 'var(--x-amber-l)' },
  apac:     { c: '#0891b2', bg: 'var(--x-cyan-l)' },
}

export const WF = {
  assigned:         { l: 'Assigned',     c: '#64748b', bg: 'var(--x-slate-l)',  i: '\u2022' },
  wip:              { l: 'WIP',          c: '#0891b2', bg: 'var(--x-cyan-l)',   i: '\u2699' },
  under_review:     { l: 'Under Review', c: '#d97706', bg: 'var(--x-amber-l)',  i: '\u2696' },
  rejected:         { l: 'Rejected',     c: '#dc2626', bg: 'var(--x-red-l)',    i: '\u21A9' },
  approved:         { l: 'Approved',     c: '#16a34a', bg: 'var(--x-green-l)',  i: '\u2713' },
  pending_director: { l: 'Pending D.',   c: '#7c3aed', bg: 'var(--x-purple-l)', i: '\u279D' },
} as const

export const PL_CAPTIONS = [
  'Revenue','Consulting Revenue','Product Revenue','Total Revenue',
  'Cost of Revenue','Gross Profit','Salaries & Wages','Professional Services',
  'Software & Technology','Travel & Entertainment','Depreciation',
  'Total OpEx','Operating Income','Interest Expense','Income Tax','Net Income',
] as const

export const BS_CAPTIONS = [
  'Cash','Accounts Receivable','Prepaid Expenses','Total Current Assets',
  'PP&E','Intangibles','Total Assets','Accounts Payable','Accrued Liabilities',
  'Total Current Liabilities','Long-Term Debt','Total Liabilities','Equity',
] as const
