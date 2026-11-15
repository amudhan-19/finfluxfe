// @author  veera
// @file    features/admin-users/components/UserBulkRoleBar.tsx

import { Box, Button, Stack, Typography } from '@mui/material'
import { ArrowRight, Filter } from 'lucide-react'
import type { Role } from '@/types/models'
import { StatsCard } from '@/features/admin-users/components/ui/StatsCard'
import { ADMIN_USER_ROLES } from '@/features/admin-users/adminUserRoles'
import { roleLabel } from '@/features/admin-users/utils/roleLabel'

export type UserBulkRoleBarProps = {
  selectedCount: number
  onApplyRole: (role: Role) => void
  onClear: () => void
  isPending?: boolean
}

export function UserBulkRoleBar({ selectedCount, onApplyRole, onClear, isPending }: UserBulkRoleBarProps) {
  if (selectedCount <= 0) return null
  return (
    <StatsCard className="users-bulk-bar">
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Filter size={16} strokeWidth={2} />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {selectedCount} user{selectedCount === 1 ? '' : 's'} selected
          </Typography>
        </Stack>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.04 }}>
          Quick assign
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {ADMIN_USER_ROLES.map((r) => (
            <Button
              key={r}
              size="small"
              variant="outlined"
              color="primary"
              disabled={isPending}
              onClick={() => onApplyRole(r)}
              endIcon={<ArrowRight size={14} />}
            >
              {roleLabel(r)}
            </Button>
          ))}
          <Button size="small" color="secondary" disabled={isPending} onClick={onClear}>
            Clear
          </Button>
        </Stack>
      </Stack>
    </StatsCard>
  )
}
