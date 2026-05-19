'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useSiteConfigStore } from '@/stores/site-config-store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sprout, LayoutDashboard, LogOut, Settings, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { t } = useLanguage()
  const config = useSiteConfigStore((s) => s.config)
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
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
            <img src={config.logo.url} alt={config.siteName} className="h-9 w-auto object-contain" />
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
