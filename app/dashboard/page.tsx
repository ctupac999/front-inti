'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getMyProducts } from '@/services/product-service'
import { getMyTrades } from '@/services/trade-service'
import type { Product } from '@/types/product'
import type { Trade } from '@/types/trade'
import { CATEGORY_LABELS } from '@/types/product'
import { Package, Handshake, MapPin, Plus, ChevronRight, Leaf } from 'lucide-react'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      Promise.all([getMyProducts(), getMyTrades()])
        .then(([p, t]) => { setProducts(p); setTrades(t) })
        .catch(() => null)
        .finally(() => setFetching(false))
    }
  }, [user])

  if (loading || !user) return null

  const pendingTrades = trades.filter((t) => t.status === 'pending')
  const availableProducts = products.filter((p) => p.status === 'available')

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('dashboard.greeting', { name: user.firstName })}
        </h1>
        <p className="text-gray-500 text-sm mt-1">{t('dashboard.welcome')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: t('dashboard.myProducts'), value: products.length, icon: <Package className="h-5 w-5 text-green-600" />, color: 'bg-green-50' },
          { label: t('dashboard.available'), value: availableProducts.length, icon: <Leaf className="h-5 w-5 text-emerald-600" />, color: 'bg-emerald-50' },
          { label: t('dashboard.pendingTrades'), value: pendingTrades.length, icon: <Handshake className="h-5 w-5 text-amber-600" />, color: 'bg-amber-50' },
          { label: t('dashboard.myLocations'), value: user.locations.length, icon: <MapPin className="h-5 w-5 text-blue-600" />, color: 'bg-blue-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.color} rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-2">
              {s.icon}
            </div>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-600 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Link href="/dashboard/products/new" className="flex items-center gap-3 rounded-xl border-2 border-dashed border-green-300 bg-green-50 p-5 hover:bg-green-100 transition-colors">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-600 text-white">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-green-800">{t('dashboard.publishProduct')}</p>
            <p className="text-xs text-green-600">{t('dashboard.addHarvest')}</p>
          </div>
        </Link>
        <Link href="/dashboard/trades" className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-600">
            <Handshake className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">{t('dashboard.myTrades')}</p>
            <p className="text-xs text-gray-500">{pendingTrades.length} {t('dashboard.pending')}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
        </Link>
        <Link href="/dashboard/locations" className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">{t('dashboard.myLocations')}</p>
            <p className="text-xs text-gray-500">{user.locations.length} {t('dashboard.registered')}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
        </Link>
      </div>

      {/* My products */}
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">{t('dashboard.myProducts')}</h2>
          <Link href="/dashboard/products/new" className="text-sm text-green-600 font-medium hover:underline">
            + {t('dashboard.add')}
          </Link>
        </div>
        {fetching ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{t('dashboard.noProducts')}</p>
            <Link href="/dashboard/products/new" className="text-sm text-green-600 font-medium hover:underline mt-1 inline-block">
              {t('dashboard.publishFirst')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {products.slice(0, 5).map((p) => (
              <div key={p._id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:border-green-200 transition-colors">
                {p.images[0] ? (
                  <img src={p.images[0].url} alt={p.title} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-xl">
                    🌾
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{p.title}</p>
                  <p className="text-xs text-gray-500">{CATEGORY_LABELS[p.category]} · {p.quantity} {p.unit}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  p.status === 'available' ? 'bg-green-100 text-green-700' :
                  p.status === 'reserved' ? 'bg-amber-100 text-amber-700' :
                  p.status === 'traded' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {p.status === 'available' ? t('common.status.available') : p.status === 'reserved' ? t('common.status.reserved') : p.status === 'traded' ? t('common.status.traded') : t('common.status.inactive')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
