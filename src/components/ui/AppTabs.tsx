import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

export type AppTabItem = {
  to: string
  label: string
  icon?: ReactNode
  badge?: string | number
  end?: boolean
}

export type AppTabsProps = {
  tabs: AppTabItem[]
  /** When tabs use relative paths, prefix with base route */
  base?: string
  className?: string
}

export function AppTabs({ tabs, base = '', className = '' }: AppTabsProps) {
  const rootClass = ['app-tabs', className].filter(Boolean).join(' ')

  return (
    <nav className={rootClass} aria-label="Section navigation">
      {tabs.map((tab) => {
        const to = base ? `${base.replace(/\/$/, '')}/${tab.to}` : tab.to
        return (
          <NavLink
            key={to}
            to={to}
            end={tab.end}
            className={({ isActive }) =>
              ['app-tabs__item', isActive ? 'app-tabs__item--active' : ''].filter(Boolean).join(' ')
            }
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge != null ? (
              <span className="app-navigation__badge">{tab.badge}</span>
            ) : null}
          </NavLink>
        )
      })}
    </nav>
  )
}
