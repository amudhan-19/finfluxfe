// @author  veera
// @file    features/admin-users/components/UserFilters.tsx

import type { Entity, Role, UserStatus } from '@/types/models'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { FilterBar } from '@/features/admin-users/components/ui/FilterBar'
import { SearchInput } from '@/features/admin-users/components/ui/SearchInput'
import { ADMIN_USER_ROLES, ADMIN_USER_STATUSES } from '@/features/admin-users/adminUserRoles'
import { roleLabel } from '@/features/admin-users/utils/roleLabel'

export type UserFiltersProps = {
  search: string
  onSearchChange: (v: string) => void
  roleFilter: Role | ''
  onRoleFilterChange: (v: Role | '') => void
  statusFilter: UserStatus | ''
  onStatusFilterChange: (v: UserStatus | '') => void
  entityFilter: string | ''
  onEntityFilterChange: (v: string | '') => void
  entities: Entity[]
}

export function UserFilters({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  entityFilter,
  onEntityFilterChange,
  entities,
}: UserFiltersProps) {
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ flex: { sm: '1 1 220px' }, minWidth: { sm: 200 } }}
      />
      <FilterSelect
        value={roleFilter}
        onChange={(v) => onRoleFilterChange(v as Role | '')}
        placeholder="All roles"
        aria-label="Filter by role"
        options={[
          { value: '', label: 'All roles' },
          ...ADMIN_USER_ROLES.map((r) => ({ value: r, label: roleLabel(r) })),
        ]}
        sx={{ minWidth: { xs: '100%', sm: 160 }, flex: { sm: '0 0 160px' } }}
      />
      <FilterSelect
        value={statusFilter}
        onChange={(v) => onStatusFilterChange(v as UserStatus | '')}
        placeholder="All status"
        aria-label="Filter by status"
        options={[
          { value: '', label: 'All status' },
          ...ADMIN_USER_STATUSES.map((s) => ({ value: s, label: roleLabel(s) })),
        ]}
        sx={{ minWidth: { xs: '100%', sm: 160 }, flex: { sm: '0 0 160px' } }}
      />
      <FilterSelect
        value={entityFilter}
        onChange={onEntityFilterChange}
        placeholder="All entities"
        aria-label="Filter by entity"
        options={[
          { value: '', label: 'All entities' },
          ...entities.map((e) => ({ value: e.id, label: `${e.id} — ${e.name}` })),
        ]}
        sx={{ minWidth: { xs: '100%', sm: 200 }, flex: { sm: '1 1 200px' } }}
      />
    </FilterBar>
  )
}
