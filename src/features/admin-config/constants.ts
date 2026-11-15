// @author  veera
// @file    features/admin-config/constants.ts
//
// Admin Config: module keys (API) and human labels (reference HTML parity).

/** FinFlux module_key values stored in ModuleAccess — must match backend seeds. */
export const CONFIG_MODULE_ROWS: readonly { key: string; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'flux_review', label: 'Flux Review' },
  { key: 'fincalendar', label: 'FinCalendar' },
  { key: 'settings', label: 'Settings' },
  { key: 'flux_settings', label: 'Flux Settings' },
  { key: 'approval_queue', label: 'Approval queue' },
] as const

/** API route prefix documented for product vs implementation */
export const ADMIN_RBAC_API_PREFIX = '/api/admin/rbac' as const

export const ENTITY_REGIONS = ['North America', 'Europe', 'APAC'] as const
export type ConfigEntityRegion = (typeof ENTITY_REGIONS)[number]

/** Client-side logo size guard (backend validates image/* only). */
export const MAX_LOGO_FILE_BYTES = 2 * 1024 * 1024

/** Display order for granular permission matrix category tabs. */
export const PERMISSION_GROUP_ORDER: readonly string[] = [
  'Administration',
  'Comments',
  'Flux Review',
  'Reports',
  'Settings',
  'Tasks',
  'Workflow',
]

export function sortPermissionGroups(groups: string[]): string[] {
  return [...groups].sort((a, b) => {
    const ia = PERMISSION_GROUP_ORDER.indexOf(a)
    const ib = PERMISSION_GROUP_ORDER.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
}
