// @author  veera
// @file    features/admin-users/utils/adminUserDisplayId.ts

/** Display id aligned with reference mock (TF-001 style). */
export function adminUserDisplayId(numericId: number): string {
  return `TF-${String(numericId).padStart(3, '0')}`
}
