import type { ReactNode } from 'react'
import { AppButton } from './AppButton'

export type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      {icon != null ? <div className="empty-state__icon">{icon}</div> : null}
      <h3 className="empty-state__title">{title}</h3>
      {description != null ? <p className="empty-state__description">{description}</p> : null}
      {actionLabel != null && onAction != null ? (
        <AppButton variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </AppButton>
      ) : null}
    </div>
  )
}
