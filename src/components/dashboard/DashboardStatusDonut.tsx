// @author  veera
// @file    components/dashboard/DashboardStatusDonut.tsx

import { Typography } from '@mui/material'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

export type StatusDonutSegment = {
  name: string
  value: number
  color: string
}

export type DashboardStatusDonutProps = {
  data: StatusDonutSegment[]
  centerLabel: string
  centerSubLabel?: string
}

export function DashboardStatusDonut({
  data,
  centerLabel,
  centerSubLabel = 'complete',
}: DashboardStatusDonutProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="dashboard-status-donut">
      <div className="dashboard-status-donut__chart">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={total > 0 ? data : [{ name: 'Empty', value: 1, color: 'var(--color-border)' }]}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={total > 0 ? 2 : 0}
              stroke="none"
            >
              {(total > 0 ? data : [{ name: 'Empty', value: 1, color: 'var(--color-border)' }]).map(
                (entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ),
              )}
            </Pie>
            <Tooltip
              formatter={(value) => [value ?? 0, '']}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="dashboard-status-donut__center">
          <Typography variant="h6" fontWeight={800} lineHeight={1.1}>
            {centerLabel}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {centerSubLabel}
          </Typography>
        </div>
      </div>

      <ul className="dashboard-status-donut__legend">
        {data.map((d) => (
          <li key={d.name} className="dashboard-status-donut__legend-item">
            <span className="dashboard-status-donut__dot" style={{ background: d.color }} />
            <span className="dashboard-status-donut__legend-label">{d.name}</span>
            <span className="dashboard-status-donut__legend-value" style={{ color: d.color }}>
              {d.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
