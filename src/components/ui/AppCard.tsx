import type { HTMLAttributes, ReactNode } from 'react'

export type AppCardProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode
  headerActions?: ReactNode
  footer?: ReactNode
  flush?: boolean
  children: ReactNode
}

export function AppCard({
  title,
  headerActions,
  footer,
  flush = false,
  children,
  className = '',
  ...rest
}: AppCardProps) {
  const classes = ['app-card', className].filter(Boolean).join(' ')

  return (
    <div className={classes} {...rest}>
      {title != null && (
        <div className="app-card__header">
          <div className="app-card__title">{title}</div>
          {headerActions}
        </div>
      )}
      <div className={flush ? 'app-card__body app-card__body--flush' : 'app-card__body'}>
        {children}
      </div>
      {footer != null && <div className="app-card__footer">{footer}</div>}
    </div>
  )
}
