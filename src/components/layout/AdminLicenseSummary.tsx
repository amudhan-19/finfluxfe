// @author  veera
// @file    components/layout/AdminLicenseSummary.tsx

import { KeyRound } from 'lucide-react'

export type LicenseSummaryData = {
  seats_total: number
  seats_used: number
  renewal_date?: string | null
}

function fmtRenewal(d?: string | null): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch { return d }
}

export default function AdminLicenseSummary({ lic }: { lic: LicenseSummaryData | null | undefined }) {
  if (!lic) return null
  return (
    <div className="app-topbar__licence" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <KeyRound size={14} strokeWidth={2} style={{ opacity: 0.7 }} aria-hidden />
      <span>
        <span className="app-topbar__licence-label">Total </span>
        <span className="app-topbar__licence-value">{lic.seats_total}</span>
      </span>
      <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
      <span>
        <span className="app-topbar__licence-label">Used </span>
        <span className="app-topbar__licence-value" style={{ color: 'var(--color-primary)' }}>
          {lic.seats_used}
        </span>
      </span>
      <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
      <span>
        <span className="app-topbar__licence-label">Renewal </span>
        <span className="app-topbar__licence-value">{fmtRenewal(lic.renewal_date)}</span>
      </span>
    </div>
  )
}
