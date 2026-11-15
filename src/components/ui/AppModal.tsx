import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { AppButton } from './AppButton'

export type AppModalProps = {
  open: boolean
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  size?: 'sm' | 'md' | 'lg'
  primaryAction?: { label: string; onClick: () => void; loading?: boolean; variant?: 'primary' | 'danger' }
  secondaryAction?: { label: string; onClick: () => void }
}

export function AppModal({
  open,
  title,
  subtitle,
  children,
  footer,
  onClose,
  size = 'md',
  primaryAction,
  secondaryAction,
}: AppModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

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

  const sizeClass = size === 'sm' ? 'app-modal--sm' : size === 'lg' ? 'app-modal--lg' : ''

  return (
    <div
      className="app-modal-overlay"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={dialogRef}
        className={['app-modal', sizeClass].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
      >
        <div className="app-modal__header">
          <div>
            <h2 id="app-modal-title" className="app-modal__title">{title}</h2>
            {subtitle != null ? <p className="app-modal__subtitle">{subtitle}</p> : null}
          </div>
          <button type="button" className="app-modal__close" onClick={onClose} aria-label="Close dialog">
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="app-modal__body">{children}</div>
        {(footer != null || primaryAction != null || secondaryAction != null) && (
          <div className="app-modal__footer">
            {footer ?? (
              <>
                {secondaryAction != null ? (
                  <AppButton variant="secondary" onClick={secondaryAction.onClick}>
                    {secondaryAction.label}
                  </AppButton>
                ) : null}
                {primaryAction != null ? (
                  <AppButton
                    variant={primaryAction.variant ?? 'primary'}
                    loading={primaryAction.loading}
                    onClick={primaryAction.onClick}
                  >
                    {primaryAction.label}
                  </AppButton>
                ) : null}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
