'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Package,
  Handshake,
  ShieldCheck,
  Mail,
  Scale,
  Search,
  Menu,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', labelKey: 'admin.nav.dashboard', icon: LayoutDashboard },
  { href: '/admin/users', labelKey: 'admin.nav.users', icon: Users },
  { href: '/admin/products', labelKey: 'admin.nav.products', icon: Package },
  { href: '/admin/trades', labelKey: 'admin.nav.trades', icon: Handshake },
  { href: '/admin/config', labelKey: 'admin.nav.config', icon: ShieldCheck },
  { href: '/admin/email-templates', labelKey: 'admin.nav.emailTemplates', icon: Mail },
  { href: '/admin/legal', labelKey: 'admin.nav.legal', icon: Scale },
  { href: '/admin/product-classification', labelKey: 'admin.nav.productClassification', icon: Search },
]

function Sidebar({ pathname, t, onNavigate }: { pathname: string; t: (key: string) => string; onNavigate?: () => void }) {
  return (
    <nav className="p-2 space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? 'bg-green-50 text-green-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {t(item.labelKey)}
          </Link>
        )
      })}
    </nav>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center gap-3 bg-white border-b px-4 py-3 lg:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link href="/admin" className="flex items-center gap-2">
          <div className="p-1 bg-green-100 rounded-lg">
            <ShieldCheck className="h-4 w-4 text-green-700" />
          </div>
          <span className="font-bold text-gray-900 text-sm">Admin</span>
        </Link>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white border-r shadow-xl transition-transform duration-200 lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="p-1.5 bg-green-100 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-green-700" />
            </div>
            <span className="font-bold text-gray-900">Admin</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <Sidebar pathname={pathname} t={t} onNavigate={() => setIsMobileMenuOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="w-64 bg-white border-r shrink-0 hidden lg:block">
        <div className="p-4 border-b">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-green-700" />
            </div>
            <span className="font-bold text-gray-900">Admin</span>
          </Link>
        </div>
        <Sidebar pathname={pathname} t={t} />
      </aside>

      <main className="flex-1 min-w-0 lg:pt-0 pt-14">
        {children}
      </main>
    </div>
  )
}
