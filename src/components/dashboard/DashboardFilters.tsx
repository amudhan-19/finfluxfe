// @author  veera
// @file    components/dashboard/DashboardFilters.tsx

import { Box } from '@mui/material'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { DASHBOARD_REGIONS } from '@/components/dashboard/useDashboardMetrics'

export type DashboardFiltersProps = {
  filterRegion: string
  filterTag: string
  onRegionChange: (v: string) => void
  onTagChange: (v: string) => void
  tags: string[]
}

export function DashboardFilters({
  filterRegion,
  filterTag,
  onRegionChange,
  onTagChange,
  tags,
}: DashboardFiltersProps) {
  return (
    <Box className="dashboard-filters">
      <FilterSelect
        value={filterRegion}
        onChange={onRegionChange}
        placeholder="All regions"
        aria-label="Filter by region"
        fullWidth={false}
        options={[
          { value: 'all', label: 'All regions' },
          ...DASHBOARD_REGIONS.map((r) => ({ value: r, label: r })),
        ]}
      />
      <FilterSelect
        value={filterTag}
        onChange={onTagChange}
        placeholder="All tags"
        aria-label="Filter by tag"
        fullWidth={false}
        options={[
          { value: 'all', label: 'All tags' },
          ...tags.map((t) => ({ value: t, label: t })),
        ]}
      />
    </Box>
  )
}
