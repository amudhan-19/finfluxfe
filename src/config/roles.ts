// @author  veera
// @file    config/roles.ts

import type { ReactNode } from 'react'

export const APP_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  DIRECTOR: 'director',
  ANALYST: 'analyst',
} as const

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES]

export type RouteAccessConfig = {
  id: string
  path: string
  allowedRoles: AppRole[]
  defaultChild?: string
  hiddenFromNav?: boolean
  navLabel?: string
  navIcon?: ReactNode
  children?: RouteAccessConfig[]
}
