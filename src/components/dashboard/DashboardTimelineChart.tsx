// @author  veera
// @file    components/dashboard/DashboardTimelineChart.tsx

import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined'
import { Box, Chip, Typography } from '@mui/material'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { WF } from '@/constants/theme'
import { dueInfo } from '@/utils/helpers'
import { STATUS_PROGRESS } from '@/components/dashboard/useDashboardMetrics'
import type { EntityListItem, EntityStatus } from '@/types/models'

export type DashboardTimelineChartProps = {
  entities: EntityListItem[]
}

export function DashboardTimelineChart({ entities }: DashboardTimelineChartProps) {
  if (entities.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No entities to display.
      </Typography>
    )
  }

  const chartData = entities.map((c) => {
    const status = (c.status as EntityStatus) || 'assigned'
    const wfi = WF[(status as keyof typeof WF) || 'assigned']
    return {
      id: c.id,
      name: c.name,
      pct: STATUS_PROGRESS[status] || 0,
      fill: wfi.c,
      statusLabel: wfi.l,
      entity: c,
    }
  })

  const chartHeight = Math.max(220, entities.length * 44)

  return (
    <div className="dashboard-timeline-chart">
      <div className="dashboard-timeline-chart__bars">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 8, bottom: 4, left: 4 }}
            barCategoryGap="22%"
          >
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--color-text-primary)' }}
              axisLine={false}
              tickLine={false}
            />
            <Bar
              dataKey="pct"
              radius={[0, 6, 6, 0]}
              barSize={12}
              background={{ fill: 'var(--color-bg-muted)', radius: 6 }}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="dashboard-timeline-chart__meta">
        {chartData.map((row) => {
          const c = row.entity
          const di = dueInfo(c.sub_due_date || undefined)
          const assignees = (c.assignees || []).slice(0, 2)

          return (
            <div key={row.id} className="dashboard-timeline-chart__meta-row">
              <Box className="dashboard-timeline-chart__avatars">
                {assignees.map((u) => (
                  <span
                    key={u.id}
                    title={u.name}
                    className="dashboard-timeline-chart__avatar"
                    style={{ background: u.color || '#64748b' }}
                  >
                    {u.initials}
                  </span>
                ))}
                <span
                  title={c.supervisor.name}
                  className="dashboard-timeline-chart__avatar dashboard-timeline-chart__avatar--supervisor"
                  style={{ background: c.supervisor.color || '#2563eb' }}
                >
                  {c.supervisor.initials}
                </span>
              </Box>
              <Chip
                label={di.l}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  bgcolor: di.bg,
                  color: di.c,
                  border: 'none',
                }}
              />
              <ChevronRightOutlined sx={{ fontSize: 18, color: 'var(--color-text-muted)' }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
