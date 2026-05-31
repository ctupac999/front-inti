'use client'

import { useEffect, useState } from 'react'
import { getProducts, type FilterParams } from '@/services/product-service'
import type { Product } from '@/types/product'
import { CATEGORY_LABELS } from '@/types/product'
import { useLanguage } from '@/contexts/language-context'
import { Search, MapPin, Leaf } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[]

export default function ProductsPage() {
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterParams>({ page: 1, limit: 12 })
  const [search, setSearch] = useState('')

  const fetchProducts = async (f: FilterParams) => {
    setLoading(true)
    try {
      const res = await getProducts(f)
      setProducts(res.products)
      setTotal(res.total)
    } catch {
      /* empty */
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchProducts(filters) }, [filters])

  const applySearch = () => setFilters((f) => ({ ...f, search, page: 1 }))

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('products.title')}</h1>
        <p className="text-gray-500 mt-1">{total} {t('products.subtitle')}</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              placeholder={t('products.searchPlaceholder')}
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </div>
          <button
            onClick={applySearch}
            className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            {t('products.search')}
          </button>
        </div>
        <select
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value || undefined, page: 1 }))}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white"
        >
          <option value="">{t('products.allCategories')}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-gray-100 h-72 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Leaf className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>{t('products.noResults')}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((p) => (
            <Link key={p._id} href={`/productos/${p._id}`} className="group block rounded-2xl border bg-white overflow-hidden hover:shadow-md hover:border-green-200 transition-all">
              <div className="aspect-square bg-green-50 overflow-hidden relative">
                {p.images[0] ? (
                  <Image
                    src={p.images[0].url}
                    alt={p.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    style={{ objectPosition: p.images[0].objectPosition || 'center center' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">🌾</div>
                )}
              </div>
              <div className="p-4">
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  {CATEGORY_LABELS[p.category]}
                </span>
                <h3 className="font-semibold text-gray-900 mt-2 truncate">{p.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{p.quantity} {p.unit}</p>
                {p.isOrganic && (
                  <span className="text-xs text-emerald-600 font-medium">Organico</span>
                )}
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                  <MapPin className="h-3 w-3" />
                  {p.location.municipality}, {p.location.province}
                </div>
                <div className="mt-3 pt-3 border-t flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                    {p.owner.firstName[0]}
                  </div>
                  <span className="text-xs text-gray-500 truncate">
                    {p.owner.firstName} {p.owner.lastName}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Paginacion */}
      {total > 12 && (
        <div className="flex justify-center gap-2 mt-10">
          <button
            onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            {t('common.previous')}
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">{t('common.page')} {page} {t('common.of')} {Math.ceil(total / 12)}</span>
          <button
            onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
            disabled={page >= Math.ceil(total / 12)}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            {t('common.next')}
          </button>
        </div>
      )}
    </div>
  )
}
