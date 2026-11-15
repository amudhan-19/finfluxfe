// @author  veera
// @file    features/admin-config/components/ConfigCollapsible.tsx

import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ConfigCollapsibleProps = {
  title: string
  subtitle: string
  icon: LucideIcon
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}

export function ConfigCollapsible({
  title,
  subtitle,
  icon: Icon,
  open,
  onToggle,
  children,
}: ConfigCollapsibleProps) {
  return (
    <section className={`config-section${open ? ' config-section--open' : ''}`}>
      <button
        type="button"
        className="config-section__header"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="config-section__icon" aria-hidden>
          <Icon size={18} strokeWidth={2} />
        </span>
        <span className="config-section__text">
          <span className="config-section__title">{title}</span>
          <span className="config-section__subtitle">{subtitle}</span>
        </span>
        <span className="config-section__toggle" aria-hidden>
          <ChevronDown size={16} strokeWidth={2.5} />
        </span>
      </button>
      {open ? (
        <div className="config-section__body">
          {children}
        </div>
      ) : null}
    </section>
  )
}
