'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useSocket } from '@/contexts/socket-context'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  type NotificationItem,
} from '@/services/notification-service'
import { ArrowLeft, Bell, CheckCheck, Filter } from 'lucide-react'
import { toast } from 'sonner'

export default function NotificationsPage() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()
  const { setUnreadCount } = useSocket()
  const router = useRouter()

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [total, setTotal] = useState(0)
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [fetching, setFetching] = useState(true)
  const limit = 20

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    getNotifications(page, limit, filter)
      .then((res) => {
        if (cancelled) return
        setNotifications(res.notifications)
        setTotal(res.total)
        setUnreadTotal(res.unreadTotal)
        setFetching(false)
      })
      .catch(() => {
        if (cancelled) return
        toast.error('Error al cargar notificaciones')
        setFetching(false)
      })
    return () => { cancelled = true }
  }, [user, page, filter])

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      )
      setUnreadTotal((prev) => Math.max(0, prev - 1))
      setUnreadCount(Math.max(0, unreadTotal - 1))
    } catch {
      toast.error('Error al marcar como leída')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadTotal(0)
      setUnreadCount(0)
    } catch {
      toast.error('Error al marcar todas como leídas')
    }
  }

  const totalPages = Math.ceil(total / limit)

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> {t('common.backToPanel')}
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('notifications.title')}
            {unreadTotal > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({unreadTotal} {t('notifications.unread')})
              </span>
            )}
          </h1>
          {unreadTotal > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              <CheckCheck className="h-4 w-4" /> {t('notifications.markAllRead')}
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-6">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f)
                setPage(1)
              }}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              {f === 'all' ? t('notifications.all') : t('notifications.unreadOnly')}
            </button>
          ))}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-gray-500 shadow-sm">
            <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>{t('notifications.empty')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => !n.read && handleMarkRead(n._id)}
                className={`bg-white rounded-xl p-4 shadow-sm border transition-colors cursor-pointer ${
                  n.read
                    ? 'border-gray-100'
                    : 'border-green-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2.5 h-2.5 mt-1.5 rounded-full shrink-0 ${
                      n.read ? 'bg-gray-300' : 'bg-green-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm ${
                          n.read ? 'text-gray-600' : 'text-gray-900 font-medium'
                        }`}
                      >
                        {n.title}
                      </p>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {n.message && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        &quot;{n.message}&quot;
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1 capitalize">
                      {n.type.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.previous')}
            </button>
            <span className="text-sm text-gray-500">
              {t('common.page')} {page} {t('common.of')} {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.next')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
