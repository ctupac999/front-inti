import { get, patch } from '@/utils/api'
import { API_ROUTES } from '@/utils/api-config'

export interface NotificationItem {
  _id: string
  user: string
  type: 'trade_proposed' | 'trade_accepted' | 'trade_rejected' | 'trade_cancelled'
  referenceId?: string
  title: string
  message?: string
  read: boolean
  createdAt: string
}

export interface NotificationsResponse {
  notifications: NotificationItem[]
  total: number
  unreadTotal: number
  page: number
  limit: number
}

export async function getNotifications(
  page = 1,
  limit = 20,
  filter?: 'all' | 'unread',
): Promise<NotificationsResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (filter && filter !== 'all') params.set('filter', filter)
  return get<NotificationsResponse>(`${API_ROUTES.notifications}?${params.toString()}`)
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return get<{ count: number }>(API_ROUTES.notificationsUnreadCount)
}

export async function markAsRead(id: string): Promise<NotificationItem> {
  return patch<NotificationItem>(API_ROUTES.notificationsMarkRead(id), {})
}

export async function markAllAsRead(): Promise<{ acknowledged: boolean }> {
  return patch<{ acknowledged: boolean }>(API_ROUTES.notificationsReadAll, {})
}
