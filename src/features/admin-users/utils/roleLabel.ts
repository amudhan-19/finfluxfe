// @author  veera
// @file    features/admin-users/utils/roleLabel.ts

export function roleLabel(role: string): string {
  if (!role) return ''
  return role.charAt(0).toUpperCase() + role.slice(1)
}
