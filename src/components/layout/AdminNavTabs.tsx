// @author  veera
// @file    components/layout/AdminNavTabs.tsx
//
// Horizontal admin nav — fixed teal bar matching enterprise reference.

import { NavLink, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

export type AdminNavItem = {
  to: string
  label: string
  icon: ReactNode
  badgeCount?: number
}

type AdminNavTabsProps = {
  tabs: AdminNavItem[]
}

export default function AdminNavTabs({ tabs }: AdminNavTabsProps) {
  const { pathname } = useLocation()

  return (
    <nav className="app-navigation" aria-label="Admin navigation">
      <div className="app-navigation__inner">
        {tabs.map((t) => {
          const isActive = pathname === t.to || pathname.startsWith(`${t.to}/`)
          return (
            <NavLink
              key={t.to}
              to={t.to}
              className={[
                'app-navigation__link',
                isActive ? 'app-navigation__link--active' : '',
              ].filter(Boolean).join(' ')}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.badgeCount != null && t.badgeCount > 0 ? (
                <span className="app-navigation__badge">{t.badgeCount} READY</span>
              ) : null}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
