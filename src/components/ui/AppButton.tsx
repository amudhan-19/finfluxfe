import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type AppButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type AppButtonSize = 'sm' | 'md' | 'lg'

export type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AppButtonVariant
  size?: AppButtonSize
  loading?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
}

export function AppButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  iconLeft,
  iconRight,
  children,
  className = '',
  type = 'button',
  ...rest
}: AppButtonProps) {
  const classes = [
    'app-btn',
    `app-btn--${variant}`,
    `app-btn--${size}`,
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className="app-btn__spinner" aria-hidden />
      ) : iconLeft ? (
        <span className="app-btn__icon" aria-hidden>{iconLeft}</span>
      ) : null}
      {children != null && <span>{children}</span>}
      {!loading && iconRight ? (
        <span className="app-btn__icon" aria-hidden>{iconRight}</span>
      ) : null}
    </button>
  )
}
