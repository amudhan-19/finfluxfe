// @author  veera
// @file    features/admin-config/moduleAccessHelpers.ts

import type { Role } from '@/types/models'

export type StringListByRole = Partial<Record<Role, string[]>>

export function listIncludes(list: string[] | undefined, key: string): boolean {
  return Boolean(list?.includes(key))
}

export function toggleKeyInList(list: string[] | undefined, key: string, enabled: boolean): string[] {
  const cur = list ?? []
  if (enabled) {
    return cur.includes(key) ? cur : [...cur, key]
  }
  return cur.filter((x) => x !== key)
}
