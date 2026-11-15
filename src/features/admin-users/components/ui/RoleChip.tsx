import { Shield } from 'lucide-react'
import { AppBadge } from '@/components/ui/AppBadge'

type RoleChipProps = {
  label: string
}

export function RoleChip({ label }: RoleChipProps) {
  return (
    <AppBadge variant="neutral">
      <Shield size={14} strokeWidth={2} style={{ marginRight: 3 }} aria-hidden />
      {label}
    </AppBadge>
  )
}
