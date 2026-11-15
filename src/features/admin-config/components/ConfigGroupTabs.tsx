// @author  veera
// @file    features/admin-config/components/ConfigGroupTabs.tsx

export type ConfigGroupTabsProps = {
  groups: string[]
  active: string
  onChange: (group: string) => void
}

export function ConfigGroupTabs({ groups, active, onChange }: ConfigGroupTabsProps) {
  return (
    <div className="config-perm-tabs" role="tablist" aria-label="Permission categories">
      {groups.map((group) => {
        const isActive = group === active
        return (
          <button
            key={group}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={['config-perm-tabs__item', isActive ? 'config-perm-tabs__item--active' : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => onChange(group)}
          >
            {group}
          </button>
        )
      })}
    </div>
  )
}
