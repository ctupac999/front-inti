'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuth } from '@/contexts/auth-context'
import { API_BASE_URL } from '@/utils/api-config'
import type { NotificationItem } from '@/services/notification-service'

interface SocketContextType {
  unreadCount: number
  notifications: NotificationItem[]
  setUnreadCount: (count: number) => void
  addNotification: (notif: NotificationItem) => void
}

const SocketContext = createContext<SocketContextType>({} as SocketContextType)

const WS_BASE = API_BASE_URL.replace('/api', '')

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const addNotification = useCallback((notif: NotificationItem) => {
    setNotifications((prev) => [notif, ...prev].slice(0, 20))
  }, [])

  const prevAuthenticated = useRef(isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      if (prevAuthenticated.current) {
        prevAuthenticated.current = false
        setUnreadCount(0)
      }
      return
    }

    prevAuthenticated.current = true

    const token = localStorage.getItem('token')
    if (!token) return

    const socket = io(`${WS_BASE}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {})

    socket.on('unread-count', (count: number) => {
      setUnreadCount(count)
    })

    socket.on('notification', (notif: NotificationItem) => {
      addNotification(notif)
      setUnreadCount((prev) => prev + 1)
    })

    socket.on('connect_error', () => {})

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [isAuthenticated, addNotification])

  return (
    <SocketContext.Provider
      value={{ unreadCount, notifications, setUnreadCount, addNotification }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
