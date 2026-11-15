import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { AppButton } from './AppButton'

export type AppDrawerProps = {
  open: boolean
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  wide?: boolean
  className?: string
  primaryAction?: { label: string; onClick: () => void; loading?: boolean }
  secondaryAction?: { label: string; onClick: () => void }
}

export function AppDrawer({
  open,
  title,
  subtitle,
  children,
  footer,
  onClose,
  wide = false,
  className = '',
  primaryAction,
  secondaryAction,
}: AppDrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="app-drawer-overlay" role="presentation" onClick={onClose} />
      <aside
        className={['app-drawer', wide ? 'app-drawer--wide' : '', className].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-drawer-title"
      >
        <div className="app-drawer__header">
          <div>
            <h2 id="app-drawer-title" className="app-drawer__title">{title}</h2>
            {subtitle != null ? <p className="app-drawer__subtitle">{subtitle}</p> : null}
          </div>
          <button type="button" className="app-modal__close" onClick={onClose} aria-label="Close panel">
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="app-drawer__body">{children}</div>
        {(footer != null || primaryAction != null || secondaryAction != null) && (
          <div className="app-drawer__footer">
            {footer ?? (
              <>
                {secondaryAction != null ? (
                  <AppButton variant="secondary" onClick={secondaryAction.onClick}>
                    {secondaryAction.label}
                  </AppButton>
                ) : null}
                {primaryAction != null ? (
                  <AppButton variant="primary" loading={primaryAction.loading} onClick={primaryAction.onClick}>
                    {primaryAction.label}
                  </AppButton>
                ) : null}
              </>
            )}
          </div>
        )}
      </aside>
    </>
  )
}
