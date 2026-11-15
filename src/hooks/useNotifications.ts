// @author  veera
// @file    hooks/useNotifications.ts
//
// React Query hooks for in-app notifications.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationListParams,
} from '@/api/notifications'

const NOTIF_KEY = 'notifications'

export function useNotifications(params?: NotificationListParams) {
  return useQuery({
    queryKey: [NOTIF_KEY, 'list', params],
    queryFn: () => fetchNotifications(params),
    staleTime: 15_000,
  })
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: [NOTIF_KEY, 'unread-count'],
    queryFn: fetchUnreadCount,
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTIF_KEY] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTIF_KEY] })
    },
  })
}
