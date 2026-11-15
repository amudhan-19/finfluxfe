import type { ReactNode } from 'react'

export type SettingsTabItem = {
  id: string
  label: string
  icon?: ReactNode
}

export type SettingsTabsProps = {
  tabs: SettingsTabItem[]
  active: string
  onChange: (id: string) => void
  className?: string
  'aria-label'?: string
}

export function SettingsTabs({
  tabs,
  active,
  onChange,
  className = '',
  'aria-label': ariaLabel = 'Settings sections',
}: SettingsTabsProps) {
  const rootClass = ['settings-tabs', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`settings-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`settings-panel-${tab.id}`}
            className={[
              'settings-tabs__item',
              isActive ? 'settings-tabs__item--active' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon != null ? (
              <span className="settings-tabs__icon" aria-hidden>
                {tab.icon}
              </span>
            ) : null}
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
