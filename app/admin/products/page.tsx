'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { deleteProduct, getAllProductsAdmin, updateProduct } from '@/services/product-service'
import { Product, CATEGORY_LABELS } from '@/types/product'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, Eye, Search, Trash2 } from 'lucide-react'

const statusColor: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  reserved: 'bg-yellow-100 text-yellow-700',
  traded: 'bg-blue-100 text-blue-700',
  inactive: 'bg-gray-100 text-gray-600',
}

export default function AdminProductsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [fetching, setFetching] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/auth/login')
      else if (user.role !== 'admin') router.push('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      getAllProductsAdmin()
        .then(res => setProducts(res.products))
        .catch(() => toast.error('Error al cargar productos'))
        .finally(() => setFetching(false))
    }
  }, [user])

  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
    </div>
  )

  const filteredProducts = products.filter((p) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    const owner = typeof p.owner === 'object' ? `${p.owner.firstName} ${p.owner.lastName}` : ''
    return (
      p.title.toLowerCase().includes(term)
      || p.category.toLowerCase().includes(term)
      || owner.toLowerCase().includes(term)
    )
  })

  const changeStatus = async (product: Product, status: Product['status']) => {
    try {
      setUpdatingId(product._id)
      const form = new FormData()
      form.append('status', status)
      await updateProduct(product._id, form)
      setProducts((prev) => prev.map((p) => (p._id === product._id ? { ...p, status } : p)))
      toast.success('Estado actualizado')
    } catch {
      toast.error('No se pudo actualizar el estado')
    } finally {
      setUpdatingId(null)
    }
  }

  const removeItem = async (productId: string) => {
    const ok = window.confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')
    if (!ok) return

    try {
      setUpdatingId(productId)
      await deleteProduct(productId)
      setProducts((prev) => prev.filter((p) => p._id !== productId))
      toast.success('Producto eliminado')
    } catch {
      toast.error('No se pudo eliminar el producto')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> Volver al admin
        </Link>

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Productos ({products.length})</h1>
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, categoría o dueño"
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-emerald-200 focus:ring"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Producto</th>
                  <th className="text-left px-5 py-3">Categoría</th>
                  <th className="text-left px-5 py-3">Propietario</th>
                  <th className="text-left px-5 py-3">Estado</th>
                  <th className="text-left px-5 py-3">Vistas</th>
                  <th className="text-left px-5 py-3">Fecha</th>
                  <th className="text-left px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map(p => {
                  const owner = typeof p.owner === 'object' ? p.owner : null
                  return (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900 max-w-xs truncate">{p.title}</td>
                      <td className="px-5 py-3 text-gray-500">{CATEGORY_LABELS[p.category as keyof typeof CATEGORY_LABELS] || p.category}</td>
                      <td className="px-5 py-3 text-gray-500">{owner?.firstName} {owner?.lastName}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[p.status] || 'bg-gray-100 text-gray-600'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 flex items-center gap-1"><Eye className="h-3 w-3" />{p.views}</td>
                      <td className="px-5 py-3 text-gray-400">{new Date(p.createdAt || '').toLocaleDateString('es-ES')}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/productos/${p._id}`} className="text-green-600 hover:underline text-xs">Ver</Link>
                          {(['available', 'reserved', 'inactive'] as Product['status'][]).map((status) => (
                            <button
                              key={status}
                              disabled={updatingId === p._id || status === p.status}
                              onClick={() => changeStatus(p, status)}
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                status === p.status
                                  ? 'bg-emerald-600 text-white'
                                  : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                          <button
                            disabled={updatingId === p._id}
                            onClick={() => removeItem(p._id)}
                            className="rounded-full border border-red-200 p-1 text-red-600 hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
