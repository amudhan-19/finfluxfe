import type { ReactNode } from 'react'

export type PageHeaderProps = {
  title: string
  subtitle?: ReactNode
  icon?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, icon, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__main">
        <div className="page-header__title-row">
          {icon != null ? <span className="page-header__icon">{icon}</span> : null}
          <h1 className="page-header__title">{title}</h1>
        </div>
        {subtitle != null ? <p className="page-header__subtitle">{subtitle}</p> : null}
      </div>
      {actions != null ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  )
}
