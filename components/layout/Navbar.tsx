'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useSiteConfigStore } from '@/stores/site-config-store'
import { useSocket } from '@/contexts/socket-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sprout, LayoutDashboard, LogOut, Settings, ShieldCheck, Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import LanguageSwitcher from './LanguageSwitcher'
import Image from 'next/image'
import { markAllAsRead } from '@/services/notification-service'

function timeAgo(dateStr: string) {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days}d`
  return new Date(dateStr).toLocaleDateString('es-ES')
}

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { t } = useLanguage()
  const config = useSiteConfigStore((s) => s.config)
  const { unreadCount, notifications, setUnreadCount } = useSocket()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    setUnreadCount(0)
  }

  const handleNotifClick = (notif: { referenceId?: string; _id: string }) => {
    if (notif.referenceId) {
      router.push('/dashboard/trades')
    }
  }

  return (
    <header
      className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60"
      suppressHydrationWarning
    >
      <div
        className="container mx-auto flex h-16 items-center justify-between px-4"
        suppressHydrationWarning
      >
        <Link href="/" className="flex items-center gap-2">
          {config?.logo?.url ? (
            <Image src={config.logo.url} alt={config.siteName} width={0} height={36} className="h-9 w-auto object-contain" />
          ) : (
            <Sprout className="h-7 w-7 text-green-600" />
          )}
          <span className="text-xl font-bold text-green-800">
            {config?.siteName || 'INTI'}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/productos" className="text-gray-600 hover:text-green-700 transition-colors">
            {t('nav.products')}
          </Link>
          <Link href="/como-funciona" className="text-gray-600 hover:text-green-700 transition-colors">
            {t('nav.howItWorks')}
          </Link>
        </nav>

        <div className="flex items-center gap-2" suppressHydrationWarning>
          <LanguageSwitcher />

          {isAuthenticated && user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-green-700 transition-colors ml-1"
              >
                <LayoutDashboard className="h-4 w-4" />
                {t('nav.myPanel')}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger className="relative outline-none" aria-label={t('notifications.title')}>
                  <Bell className="h-5 w-5 text-gray-600 hover:text-green-700 transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ring-2 ring-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                      {t('notifications.empty')}
                    </div>
                  ) : (
                    <>
                      {notifications.slice(0, 5).map((n) => (
                        <DropdownMenuItem
                          key={n._id}
                          onClick={() => handleNotifClick(n)}
                          className="flex items-start gap-3 px-4 py-3 cursor-pointer"
                        >
                          <div
                            className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${n.read ? 'bg-gray-300' : 'bg-green-500'}`}
                          />
                          <div className="min-w-0">
                            <p className="text-sm text-gray-900">{n.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                          </div>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => router.push('/dashboard/notifications')}
                        className="justify-center text-sm text-green-600 font-medium"
                      >
                        {t('notifications.viewAll')} →
                      </DropdownMenuItem>
                      {unreadCount > 0 && (
                        <DropdownMenuItem
                          onClick={handleMarkAllRead}
                          className="justify-center text-xs text-gray-500"
                        >
                          {t('notifications.markAllRead')}
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent hover:ring-green-400 transition-all">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-green-100 text-green-700 text-sm font-semibold">
                      {user.firstName[0]}{user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                    <Settings className="h-4 w-4 mr-2" />{t('nav.profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />{t('nav.dashboard')}
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/admin')}>
                        <ShieldCheck className="h-4 w-4 mr-2" />{t('nav.admin')}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />{t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors"
              >
                {t('nav.login')}
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
              >
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
