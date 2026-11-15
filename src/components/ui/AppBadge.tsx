import type { HTMLAttributes } from 'react'

export type AppBadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary'

export type AppBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: AppBadgeVariant
}

export function AppBadge({ variant = 'neutral', className = '', children, ...rest }: AppBadgeProps) {
  const classes = ['app-badge', `app-badge--${variant}`, className].filter(Boolean).join(' ')
  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  )
}
