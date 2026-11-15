// @author  veera
// @file    features/admin-users/hooks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Role } from '@/types/models'
import * as usersApi from './api'

export const adminUsersKey = ['admin-users'] as const
export const adminLicensesKey = ['admin-licenses'] as const

export function useAdminUsers() {
  return useQuery({ queryKey: adminUsersKey, queryFn: () => usersApi.listUsers() })
}

export function useAdminLicenses() {
  return useQuery({ queryKey: adminLicensesKey, queryFn: () => usersApi.getAdminLicenses() })
}

export function useInviteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: usersApi.InviteInput) => usersApi.inviteUser(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminUsersKey }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: usersApi.UpdateInput }) => usersApi.updateUser(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminUsersKey }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => usersApi.deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminUsersKey }),
  })
}

export function useBulkRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ user_ids, role }: { user_ids: number[]; role: Role }) => usersApi.bulkRole(user_ids, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminUsersKey }),
  })
}

export function useResendInvite() {
  return useMutation({ mutationFn: (id: number) => usersApi.resendInvite(id) })
}
