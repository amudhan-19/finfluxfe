// @author  veera
// @file    components/ui/SummaryStatCard.tsx

import type { SvgIconComponent } from '@mui/icons-material'

export type SummaryStatCardProps = {
  label: string
  value: number
  accentColor: string
  icon: SvgIconComponent
}

export function SummaryStatCard({ label, value, accentColor, icon: Icon }: SummaryStatCardProps) {
  return (
    <article
      className="summary-stat-card"
      style={{ borderLeftColor: accentColor }}
    >
      <div className="summary-stat-card__body">
        <div className="summary-stat-card__value" style={{ color: accentColor }}>
          {value}
        </div>
        <div className="summary-stat-card__label">{label}</div>
      </div>
      <span
        className="summary-stat-card__icon-wrap"
        style={{ color: accentColor, background: `${accentColor}14` }}
      >
        <Icon sx={{ fontSize: 22 }} />
      </span>
    </article>
  )
}
