// @author  veera
// @file    features/admin-users/adminUserRoles.ts

import type { Role, UserStatus } from '@/types/models'

export const ADMIN_USER_ROLES: Role[] = ['analyst', 'supervisor', 'director', 'admin']
export const ADMIN_USER_STATUSES: UserStatus[] = ['active', 'invited', 'disabled']
