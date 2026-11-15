import type { ReactNode } from 'react'
import { AppCard } from './AppCard'

export type SettingsCardProps = {
  icon?: ReactNode
  title?: ReactNode
  description?: ReactNode
  footer?: ReactNode
  className?: string
  children: ReactNode
}

export function SettingsCard({
  icon,
  title,
  description,
  footer,
  className = '',
  children,
}: SettingsCardProps) {
  const rootClass = ['settings-card', className].filter(Boolean).join(' ')

  return (
    <AppCard className={rootClass} footer={footer}>
      {(icon != null || title != null || description != null) && (
        <div className="settings-card__intro">
          {icon != null ? (
            <div className="settings-card__icon" aria-hidden>
              {icon}
            </div>
          ) : null}
          {(title != null || description != null) && (
            <div className="settings-card__intro-text">
              {title != null ? <h3 className="settings-card__title">{title}</h3> : null}
              {description != null ? (
                <p className="settings-card__description">{description}</p>
              ) : null}
            </div>
          )}
        </div>
      )}
      {children}
    </AppCard>
  )
}
