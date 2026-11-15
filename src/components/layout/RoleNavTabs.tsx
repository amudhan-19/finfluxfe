// @author  veera
// @file    components/layout/RoleNavTabs.tsx
//
// Role navigation — fixed teal bar with green active state.

import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

export type RoleNavTab = {
  to: string
  label: string
  icon?: ReactNode
}

export default function RoleNavTabs({ tabs, base }: { tabs: RoleNavTab[]; base: string }) {
  return (
    <nav className="app-navigation" aria-label="Module navigation">
      <div className="app-navigation__inner">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={`${base}/${t.to}`}
            end={false}
            className={({ isActive }) =>
              ['app-navigation__link', isActive ? 'app-navigation__link--active' : '']
                .filter(Boolean)
                .join(' ')
            }
          >
            {t.icon}
            <span>{t.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
