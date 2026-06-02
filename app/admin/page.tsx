'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useRouter } from 'next/navigation'
import { get } from '@/utils/api'
import { API_ROUTES } from '@/utils/api-config'
import type { User } from '@/types/user'
import type { Product } from '@/types/product'
import { Users, Package, Handshake, TrendingUp, ShieldCheck, Mail, Scale, Search } from 'lucide-react'

interface DashboardStats {
  users: { total: number; active: number }
  products: { total: number; available: number; byCategory: { _id: string; count: number }[] }
  trades: { total: number; completed: number; byStatus: { _id: string; count: number }[] }
  recent: { users: User[]; products: Product[] }
}

export default function AdminPage() {
  const { user, loading, isAdmin } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.push('/')
  }, [user, loading, isAdmin, router])

  useEffect(() => {
    if (isAdmin) {
      get<DashboardStats>(API_ROUTES.adminDashboard)
        .then(setStats)
        .catch(() => null)
        .finally(() => setFetching(false))
    }
  }, [isAdmin])

  if (loading || !user || !isAdmin) return null

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-green-100 rounded-xl">
          <ShieldCheck className="h-6 w-6 text-green-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.title')}</h1>
          <p className="text-gray-500 text-sm">{t('admin.subtitle')}</p>
        </div>
      </div>

      {/* Stats */}
      {fetching ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: t('admin.stats.users'), value: stats.users.total, sub: t('admin.stats.usersActive', { count: stats.users.active }), icon: <Users className="h-5 w-5 text-blue-600" />, color: 'bg-blue-50' },
            { label: t('admin.stats.products'), value: stats.products.total, sub: t('admin.stats.productsAvailable', { count: stats.products.available }), icon: <Package className="h-5 w-5 text-green-600" />, color: 'bg-green-50' },
            { label: t('admin.stats.trades'), value: stats.trades.total, sub: t('admin.stats.tradesCompleted', { count: stats.trades.completed }), icon: <Handshake className="h-5 w-5 text-amber-600" />, color: 'bg-amber-50' },
            { label: t('admin.stats.successRate'), value: stats.trades.total > 0 ? `${Math.round((stats.trades.completed / stats.trades.total) * 100)}%` : '0%', sub: t('admin.stats.successRateSub'), icon: <TrendingUp className="h-5 w-5 text-purple-600" />, color: 'bg-purple-50' },
          ].map((s, i) => (
            <div key={i} className={`${s.color} rounded-2xl p-5`}>
              {s.icon}
              <p className="text-3xl font-bold text-gray-900 mt-2">{s.value}</p>
              <p className="text-sm font-medium text-gray-700">{s.label}</p>
              <p className="text-xs text-gray-500">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick nav */}
      <div className="grid md:grid-cols-6 gap-4">
        {[
          { href: '/admin/users', label: t('admin.nav.users'), icon: <Users className="h-5 w-5" />, desc: t('admin.nav.usersSub') },
          { href: '/admin/products', label: t('admin.nav.products'), icon: <Package className="h-5 w-5" />, desc: t('admin.nav.productsSub') },
          { href: '/admin/trades', label: t('admin.nav.trades'), icon: <Handshake className="h-5 w-5" />, desc: t('admin.nav.tradesSub') },
          { href: '/admin/config', label: t('admin.nav.config'), icon: <ShieldCheck className="h-5 w-5" />, desc: t('admin.nav.configSub') },
          { href: '/admin/email-templates', label: t('admin.nav.emailTemplates'), icon: <Mail className="h-5 w-5" />, desc: t('emailTemplates.subtitle') },
          { href: '/admin/legal', label: t('admin.nav.legal'), icon: <Scale className="h-5 w-5" />, desc: 'Versionado legal y consentimiento' },
          { href: '/admin/product-classification', label: t('admin.nav.productClassification'), icon: <Search className="h-5 w-5" />, desc: 'Catálogo de productos y categorías' },
        ].map((item) => (
          <a key={item.href} href={item.href} className="rounded-2xl border bg-white p-5 hover:shadow-sm hover:border-green-200 transition-all block">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-100 text-green-700 mb-3">
              {item.icon}
            </div>
            <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
          </a>
        ))}
      </div>

      {/* Productos por categoría */}
      {stats?.products.byCategory && (
        <div className="mt-8 bg-white rounded-2xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4">{t('admin.byCategory')}</h2>
          <div className="space-y-2">
            {stats.products.byCategory.slice(0, 6).map((cat) => (
              <div key={cat._id} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-32 capitalize">{cat._id}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${Math.min((cat.count / stats.products.total) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
