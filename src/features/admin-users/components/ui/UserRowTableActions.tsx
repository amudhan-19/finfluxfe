// @author  veera
// @file    features/admin-users/components/ui/UserRowTableActions.tsx

import type { AdminUser } from '@/types/models'
import { IconButton, Stack, Tooltip } from '@mui/material'
import { Pencil, RefreshCw, Trash2 } from 'lucide-react'

const iconBtnSx = {
  width: 36,
  height: 36,
  borderRadius: 1.5,
  '&:focus-visible': { outlineWidth: '2px', outlineStyle: 'solid', outlineOffset: 1 },
} as const

type UserRowTableActionsProps = {
  row: AdminUser
  currentUserId?: number
  onEdit: (id: number) => void
  onDelete: (user: AdminUser) => void
  onResendInvite: (id: number) => void
}

export function UserRowTableActions({
  row,
  currentUserId,
  onEdit,
  onDelete,
  onResendInvite,
}: UserRowTableActionsProps) {
  const selectable = row.id !== currentUserId
  return (
    <Stack
      direction="row"
      spacing={0.5}
      justifyContent="flex-end"
      alignItems="center"
      sx={{ width: 1, pr: 0.25, pl: 0.5 }}
    >
      <Tooltip title="Edit user">
        <IconButton
          size="small"
          color="primary"
          onClick={() => onEdit(row.id)}
          aria-label="Edit user"
          sx={{
            ...iconBtnSx,
            '&:focus-visible': { ...iconBtnSx['&:focus-visible'], outlineColor: 'primary.main' },
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Pencil size={17} strokeWidth={2} />
        </IconButton>
      </Tooltip>
      {row.status === 'invited' && (
        <Tooltip title="Resend invite">
          <IconButton
            size="small"
            color="warning"
            onClick={() => onResendInvite(row.id)}
            aria-label="Resend invite"
            sx={{
              ...iconBtnSx,
              '&:focus-visible': { ...iconBtnSx['&:focus-visible'], outlineColor: 'warning.main' },
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <RefreshCw size={17} strokeWidth={2} />
          </IconButton>
        </Tooltip>
      )}
      {selectable && (
        <Tooltip title="Delete user">
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(row)}
            aria-label="Delete user"
            sx={{
              ...iconBtnSx,
              '&:focus-visible': { ...iconBtnSx['&:focus-visible'], outlineColor: 'error.main' },
              '&:hover': { bgcolor: 'rgba(220,38,38,0.1)' },
            }}
          >
            <Trash2 size={17} strokeWidth={2} />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  )
}
