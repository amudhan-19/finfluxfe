// @author  veera
// @file    components/dashboard/dashboardStatusIcons.tsx

import type { SvgIconComponent } from '@mui/icons-material'
import AssignmentIndOutlined from '@mui/icons-material/AssignmentIndOutlined'
import BuildOutlined from '@mui/icons-material/BuildOutlined'
import CancelOutlined from '@mui/icons-material/CancelOutlined'
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline'
import HourglassTopOutlined from '@mui/icons-material/HourglassTopOutlined'
import RateReviewOutlined from '@mui/icons-material/RateReviewOutlined'
import SettingsBackupRestoreOutlined from '@mui/icons-material/SettingsBackupRestoreOutlined'
import type { EntityStatus } from '@/types/models'

export const DASHBOARD_STATUS_ICONS: Record<EntityStatus, SvgIconComponent> = {
  assigned: AssignmentIndOutlined,
  wip: BuildOutlined,
  under_review: RateReviewOutlined,
  rejected: SettingsBackupRestoreOutlined,
  approved: CheckCircleOutline,
  pending_director: HourglassTopOutlined,
}
