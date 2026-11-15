import type { ReactNode } from 'react'
import { AppCard } from '@/components/ui/AppCard'

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <AppCard>
      <div className="users-filters">{children}</div>
    </AppCard>
  )
}
