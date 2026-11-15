import { Users } from 'lucide-react'
import { AppCard } from '@/components/ui/AppCard'

function LicenseMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'success' | 'warning' | 'danger'
}) {
  const colorVar =
    tone === 'success'
      ? 'var(--color-success)'
      : tone === 'warning'
        ? 'var(--color-warning)'
        : 'var(--color-danger)'

  return (
    <div className="users-licence-card__metric">
      <span className="users-licence-card__metric-value" style={{ color: colorVar }}>
        {value}
      </span>
      <span className="users-licence-card__metric-label">{label}</span>
    </div>
  )
}

type LicenseUtilizationCardProps = {
  seatsUsed: number
  seatsTotal: number
  utilPct: number
  utilizationSemantic: 'success' | 'warning' | 'error'
  renewalLabel: string
  counts: { active: number; invited: number; disabled: number }
  mode: 'light' | 'dark'
}

export function LicenseUtilizationCard({
  seatsUsed,
  seatsTotal,
  utilPct,
  renewalLabel,
  counts,
}: LicenseUtilizationCardProps) {
  return (
    <AppCard className="users-licence-card">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-primary-soft)',
              border: '1px solid var(--color-border)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--color-primary)',
              flexShrink: 0,
            }}
          >
            <Users size={22} strokeWidth={2} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="text-card-title" style={{ marginBottom: 4 }}>
              Licence utilisation
            </div>
            <div className="text-muted">
              {seatsUsed} of {seatsTotal} seats in use · {Math.max(0, seatsTotal - seatsUsed)} available
            </div>
          </div>
        </div>
        <div className="users-licence-card__metrics">
          <LicenseMetric label="Active" value={counts.active} tone="success" />
          <LicenseMetric label="Invited" value={counts.invited} tone="warning" />
          <LicenseMetric label="Disabled" value={counts.disabled} tone="danger" />
        </div>
      </div>
      <div className="users-licence-card__progress" aria-hidden>
        <div className="users-licence-card__progress-bar" style={{ width: `${utilPct}%` }} />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          marginTop: 'var(--space-4)',
        }}
      >
        <span style={{ fontWeight: 700 }}>
          <span className="text-muted" style={{ fontWeight: 600, marginRight: 6 }}>Utilised</span>
          <span style={{ color: 'var(--color-primary)' }}>{utilPct}%</span>
        </span>
        <span className="text-muted" style={{ fontWeight: 600 }}>
          Renewal:{' '}
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 800 }}>{renewalLabel}</span>
        </span>
      </div>
    </AppCard>
  )
}
