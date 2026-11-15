// @author  veera
// @file    components/dashboard/SupervisorDashboardView.tsx

import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import PublicOutlined from '@mui/icons-material/PublicOutlined'
import TimelineOutlined from '@mui/icons-material/TimelineOutlined'
import { Box, Chip, CircularProgress, Typography } from '@mui/material'
import { AppCard } from '@/components/ui/AppCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { SummaryStatCard } from '@/components/ui/SummaryStatCard'
import { DashboardFilters } from '@/components/dashboard/DashboardFilters'
import { DashboardStatusDonut } from '@/components/dashboard/DashboardStatusDonut'
import { DashboardTimelineChart } from '@/components/dashboard/DashboardTimelineChart'
import { DASHBOARD_STATUS_ICONS } from '@/components/dashboard/dashboardStatusIcons'
import EntityGrid from '@/components/dashboard/EntityGrid'
import { MacroCategoryModal } from '@/components/dashboard/MacroCategoryModal'
import { MACRO_CAT_COLORS, useDashboardMetrics } from '@/components/dashboard/useDashboardMetrics'
import { U } from '@/constants/uiText'
import { X } from '@/constants/theme'
import type { EntityListItem, EntityStatus } from '@/types/models'

const KPI_CONFIG: Array<{
  key: 'assigned' | 'wip' | 'under_review' | 'pending_director' | 'approved' | 'rejected'
  label: string
  color: string
  status: EntityStatus
}> = [
  { key: 'assigned', label: 'Assigned', color: X.blue, status: 'assigned' },
  { key: 'wip', label: 'Working Progress', color: X.green, status: 'wip' },
  { key: 'under_review', label: 'In Review', color: X.cyan, status: 'under_review' },
  { key: 'pending_director', label: 'Pending D.', color: X.purple, status: 'pending_director' },
  { key: 'approved', label: 'Approved', color: '#16a34a', status: 'approved' },
  { key: 'rejected', label: 'Rejected', color: X.red, status: 'rejected' },
]

export default function SupervisorDashboardView({
  basePath,
  roleLabel,
}: {
  basePath: string
  roleLabel: string
}) {
  const {
    filterTag,
    filterRegion,
    setFilterTag,
    setFilterRegion,
    isLoading,
    filtered,
    stCounts,
    approvedPct,
    pieData,
    allMacros,
    categories,
    allTags,
    modalCat,
    setModalCat,
  } = useDashboardMetrics()

  return (
    <div className="dashboard-view supervisor-dashboard">
      <PageHeader
        title="Dashboard"
        subtitle={`${filtered.length} entities · ${roleLabel}`}
        icon={<DashboardOutlined sx={{ fontSize: 22 }} />}
        actions={(
          <DashboardFilters
            filterRegion={filterRegion}
            filterTag={filterTag}
            onRegionChange={setFilterRegion}
            onTagChange={setFilterTag}
            tags={allTags}
          />
        )}
      />

      <div className="dashboard-view__summary-row">
        {KPI_CONFIG.map((k) => (
          <SummaryStatCard
            key={k.key}
            label={k.label}
            value={stCounts[k.key] ?? 0}
            accentColor={k.color}
            icon={DASHBOARD_STATUS_ICONS[k.status]}
          />
        ))}
      </div>

      <div className="dashboard-view__charts-row">
        <AppCard title="Status" className="dashboard-view__status-card">
          <DashboardStatusDonut
            data={pieData}
            centerLabel={`${approvedPct}%`}
            centerSubLabel="complete"
          />
        </AppCard>

        <AppCard
          title="Timeline"
          className="dashboard-view__timeline-card"
          headerActions={(
            <Chip
              icon={<TimelineOutlined sx={{ fontSize: '16px !important' }} />}
              label={`${approvedPct}% approved`}
              size="small"
              color="success"
              variant="outlined"
            />
          )}
        >
          <DashboardTimelineChart entities={filtered as EntityListItem[]} />
        </AppCard>
      </div>

      {allMacros.length > 0 ? (
        <AppCard
          title="Macro & Geopolitical Factors"
          className="dashboard-view__macro-card"
          headerActions={(
            <Typography variant="caption" color="text.secondary">
              {allMacros.length} factors · Click to expand
            </Typography>
          )}
        >
          <Box className="dashboard-macro-pills">
            {categories.map((cat) => {
              const color = MACRO_CAT_COLORS[cat] || X.text
              const count = allMacros.filter((m) => m.category === cat).length
              return (
                <Chip
                  key={cat}
                  label={`${cat} (${count})`}
                  onClick={() => setModalCat(cat)}
                  icon={<PublicOutlined sx={{ fontSize: 16 }} />}
                  sx={{
                    fontWeight: 700,
                    bgcolor: `${color}14`,
                    color,
                    border: `1px solid ${color}40`,
                    '&:hover': { bgcolor: `${color}22` },
                  }}
                />
              )
            })}
          </Box>
        </AppCard>
      ) : (
        <AppCard
          title="Macro & Geopolitical Factors"
          className="dashboard-view__macro-card dashboard-view__macro-card--empty"
        >
          <Box className="dashboard-macro-empty">
            <InfoOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              0 factors · Click to expand
            </Typography>
          </Box>
        </AppCard>
      )}

      <section className="dashboard-view__entities">
        <Typography variant="subtitle1" fontWeight={700}>
          Entities
        </Typography>
        {isLoading ? (
          <Box className="dashboard-view__loading">
            <CircularProgress size={28} color="primary" />
            <Typography variant="body2" color="text.secondary">
              Loading{U.ellip}
            </Typography>
          </Box>
        ) : (
          <EntityGrid entities={filtered as EntityListItem[]} basePath={basePath} />
        )}
      </section>

      <MacroCategoryModal
        open={modalCat != null}
        category={modalCat ?? ''}
        color={MACRO_CAT_COLORS[modalCat ?? ''] || X.text}
        factors={modalCat ? allMacros.filter((m) => m.category === modalCat) : []}
        onClose={() => setModalCat(null)}
      />
    </div>
  )
}
