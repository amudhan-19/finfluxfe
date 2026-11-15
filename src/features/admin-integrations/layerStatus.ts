// @author  veera
// @file    features/admin-integrations/layerStatus.ts
//
// Shared pipeline / API-mapping status helpers for Admin Integrations (Sonar:
// single place for layer counts and tone — avoids duplicated ternary chains).

import type { ApiCredential, ApiLayer } from '@/types/models'

export type HealthTone = 'success' | 'warning' | 'neutral'

export function countVerifiedInLayer(creds: ApiCredential[], layer: ApiLayer): {
  verified: number
  total: number
} {
  const items = creds.filter((c) => c.layer === layer)
  const verified = items.filter((c) => c.status === 'verified').length
  return { verified, total: items.length }
}

/** Maps verified/total counts to a display tone (empty layer → neutral). */
export function layerHealthTone(verified: number, total: number): HealthTone {
  if (total === 0) return 'neutral'
  if (verified === total) return 'success'
  if (verified > 0) return 'warning'
  return 'warning'
}

/** Row-level “API Mapping” pill vs /api-complete. */
export function apiMappingTone(complete: boolean | undefined, credCount: number): HealthTone {
  if (complete) return 'success'
  if (credCount > 0) return 'warning'
  return 'neutral'
}

export function apiMappingLabel(complete: boolean | undefined, credCount: number): string {
  if (complete) return 'Verified'
  if (credCount > 0) return 'In progress'
  return 'Not started'
}
