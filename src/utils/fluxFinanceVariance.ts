// @file    utils/fluxFinanceVariance.ts
//
// Finance-normalized variance display for Flux Review rows.

import type { FluxRow } from '@/types/models'

export type FluxDisplayVariance = {
  amount: number
  pct: number | null
  positive: boolean
}

/** Prefer backend finance fields; fall back to raw row math. */
export function fluxDisplayVariance(row: FluxRow): FluxDisplayVariance {
  if (row.finance_variance_amount != null) {
    const amount = row.finance_variance_amount
    const pct = row.finance_variance_percentage ?? row.pct_variance
    return { amount, pct, positive: amount >= 0 }
  }
  const amount = (row.current_value || 0) - (row.comp_value || 0)
  return {
    amount,
    pct: row.pct_variance,
    positive: amount >= 0,
  }
}
