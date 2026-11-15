// @author  veera
// @file    components/dashboard/EntitySliderCard.tsx

import {
  Avatar,
  AvatarGroup,
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Typography,
} from '@mui/material'
import { DASHBOARD_STATUS_ICONS } from '@/components/dashboard/dashboardStatusIcons'
import type { EntityListItem, EntityStatus } from '@/types/models'
import { WF } from '@/constants/theme'
import { fmtD, dueInfo, type DueInfo } from '@/utils/helpers'

const KNOWN_TAGS = ['tech', 'priority', 'finance', 'emea', 'apac', 'banking'] as const

function dueDateClass(di: DueInfo): string {
  if (di.over) return 'dashboard-entity-card__date-value--due-over'
  if (di.l.includes('left')) return 'dashboard-entity-card__date-value--due-soon'
  if (di.l === '—') return 'dashboard-entity-card__date-value--due-neutral'
  return 'dashboard-entity-card__date-value--due-ok'
}

function tagClass(tag: string): string {
  const key = tag.toLowerCase()
  if ((KNOWN_TAGS as readonly string[]).includes(key)) {
    return `dashboard-entity-card__tag dashboard-entity-card__tag--${key}`
  }
  return 'dashboard-entity-card__tag dashboard-entity-card__tag--default'
}

function macroProgress(count: number): number {
  if (count <= 0) return 0
  return Math.min(100, count * 20)
}

export type EntitySliderCardProps = {
  entity: EntityListItem
  onOpen: () => void
}

export function EntitySliderCard({ entity, onOpen }: EntitySliderCardProps) {
  const status = (entity.status as EntityStatus) || 'assigned'
  const wfi = WF[(status as keyof typeof WF) || 'assigned']
  const StatusIcon = DASHBOARD_STATUS_ICONS[status] ?? DASHBOARD_STATUS_ICONS.assigned
  const subDue = dueInfo(entity.sub_due_date || undefined)
  const revDue = dueInfo(entity.rev_due_date || undefined)
  const macroPct = macroProgress(entity.macro_factor_count)

  const assignees = (entity.assignees || []).slice(0, 3)
  const avatarUsers = [
    ...assignees,
    entity.supervisor,
  ]

  return (
    <Card
      className={`dashboard-entity-card dashboard-entity-card--status-${status}${subDue.over ? ' dashboard-entity-card--overdue' : ''}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen()
      }}
      role="button"
      tabIndex={0}
      elevation={0}
    >
      <Box className="dashboard-entity-card__header">
        <Typography className="dashboard-entity-card__name" variant="subtitle1" component="h3">
          {entity.name}
        </Typography>
        <Typography className="dashboard-entity-card__region" variant="caption" component="p">
          {entity.region}
        </Typography>
      </Box>

      <CardContent className="dashboard-entity-card__body">
        <Box className="dashboard-entity-card__status-row">
          <Chip
            className={`dashboard-entity-card__status-chip dashboard-entity-card__status-chip--${status}`}
            icon={<StatusIcon className="dashboard-entity-card__status-icon" />}
            label={wfi.l}
            size="small"
          />
          <Typography className="dashboard-entity-card__period" variant="caption">
            {entity.period_type}
          </Typography>
        </Box>

        <Box className="dashboard-entity-card__tags-row">
          <Box className="dashboard-entity-card__tags">
            {(entity.tags || []).map((t) => (
              <span key={t} className={tagClass(t)}>
                {t}
              </span>
            ))}
          </Box>
          <AvatarGroup max={4} className="dashboard-entity-card__avatar-group">
            {avatarUsers.map((u, i) => (
              <Avatar
                key={u.id}
                title={u.name}
                className={`dashboard-entity-card__avatar dashboard-entity-card__avatar--tone-${i % 6}`}
                alt={u.name}
              >
                {u.initials}
              </Avatar>
            ))}
          </AvatarGroup>
        </Box>

        <Box className="dashboard-entity-card__footer-row">
          <Box className="dashboard-entity-card__dates">
            <Box className="dashboard-entity-card__date-block">
              <Typography className="dashboard-entity-card__date-label" variant="caption">
                Submission
              </Typography>
              <Typography
                className={`dashboard-entity-card__date-value ${dueDateClass(subDue)}`}
                variant="body2"
                component="span"
              >
                {fmtD(entity.sub_due_date)}
              </Typography>
            </Box>
            <Box className="dashboard-entity-card__date-block">
              <Typography className="dashboard-entity-card__date-label" variant="caption">
                Review
              </Typography>
              <Typography
                className={`dashboard-entity-card__date-value ${dueDateClass(revDue)}`}
                variant="body2"
                component="span"
              >
                {fmtD(entity.rev_due_date)}
              </Typography>
            </Box>
          </Box>

          <Box className="dashboard-entity-card__macro">
            <Typography className="dashboard-entity-card__macro-label" variant="caption">
              Macro Factors
            </Typography>
            <LinearProgress
              className="dashboard-entity-card__macro-bar"
              variant="determinate"
              value={macroPct}
              aria-label={`${entity.macro_factor_count} macro factors`}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
