// @author  veera
// @file    features/admin-ontology/captionHelpers.ts
//
// Shared parsing and caption validation for Admin Ontology (comma lists,
// core vs custom name collisions).

import { BS_CAPTIONS, PL_CAPTIONS } from '@/constants/theme'

export function splitCommaList(raw: string): string[] {
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

export function isBoldCaption(c: string): boolean {
  return (
    c.startsWith('Total') ||
    ['Revenue', 'Gross Profit', 'Operating Income', 'Net Income', 'Equity'].includes(c)
  )
}

/** True if name matches a fixed T-Flux core caption for the statement (case-insensitive). */
export function isReservedCoreCaption(name: string, statement: 'pl' | 'bs'): boolean {
  const caps = statement === 'pl' ? PL_CAPTIONS : BS_CAPTIONS
  const n = name.trim().toLowerCase()
  return caps.some((c) => c.toLowerCase() === n)
}

export function isDuplicateCustomName(name: string, existingNames: readonly string[]): boolean {
  const n = name.trim().toLowerCase()
  return existingNames.some((x) => x.trim().toLowerCase() === n)
}

const NON_POSTING_ACCOUNT_TYPES = new Set([
  'heading',
  'begin-total',
  'end-total',
  'total',
])

/** GL accounts whose BC ``account_type`` is not a posting account. */
export function findNonPostingGlAccounts(
  selectedAccountNos: readonly string[],
  options: readonly { account_no: string; account_type?: string | null }[],
): string[] {
  const byNo = new Map(options.map((o) => [o.account_no, o]))
  const flagged: string[] = []
  for (const no of selectedAccountNos) {
    const acct = byNo.get(no)
    if (!acct) continue
    const t = (acct.account_type || '').toLowerCase()
    if (NON_POSTING_ACCOUNT_TYPES.has(t)) {
      flagged.push(no)
    }
  }
  return flagged
}
