import type { UserStatus } from '@/types/models'
import { AppBadge, type AppBadgeVariant } from '@/components/ui/AppBadge'

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}

function statusVariant(status: string): AppBadgeVariant {
  const s = status as UserStatus
  if (s === 'active') return 'success'
  if (s === 'invited') return 'warning'
  return 'danger'
}

type UserStatusChipProps = {
  status: string
}

export function UserStatusChip({ status }: UserStatusChipProps) {
  return <AppBadge variant={statusVariant(status)}>{cap(status)}</AppBadge>
}
