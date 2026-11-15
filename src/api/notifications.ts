// @author  veera
// @file    api/notifications.ts

import api from './client'
import type { AppNotification, UnreadCountResponse } from '@/types/models'

export interface NotificationListParams {
  unread_only?: boolean
  limit?: number
  offset?: number
}

export function fetchNotifications(params?: NotificationListParams): Promise<AppNotification[]> {
  return api.get('/api/notifications', { params }).then((r) => r.data)
}

export function fetchUnreadCount(): Promise<UnreadCountResponse> {
  return api.get('/api/notifications/unread-count').then((r) => r.data)
}

export function markNotificationRead(id: number): Promise<{ id: number; is_read: boolean }> {
  return api.patch(`/api/notifications/${id}/read`).then((r) => r.data)
}

export function markAllNotificationsRead(): Promise<{ marked_read: number }> {
  return api.patch('/api/notifications/read-all').then((r) => r.data)
}
