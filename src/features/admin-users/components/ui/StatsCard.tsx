import type { HTMLAttributes, ReactNode } from 'react'
import { AppCard } from '@/components/ui/AppCard'

type StatsCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  title?: ReactNode
  flushContent?: boolean
}

export function StatsCard({ children, title, flushContent, className = '', ...rest }: StatsCardProps) {
  return (
    <AppCard title={title} flush={flushContent} className={className} {...rest}>
      {children}
    </AppCard>
  )
}
