'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { searchClassifications, getAllClassifications, createClassification, updateClassification, deleteClassification } from '@/services/product-classification-service'
import { CATEGORY_LABELS } from '@/types/product'
import type { ProductClassification } from '@/types/product-classification'
import { Plus, Search, Pencil, Trash2, ArrowLeft, Check, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function AdminProductClassificationPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [classifications, setClassifications] = useState<ProductClassification[]>([])
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ProductClassification | null>(null)
  const [formData, setFormData] = useState({ name: '', category: '', aliases: '' })
  const [saving, setSaving] = useState(false)
  const searchActiveRef = useRef(false)

  const [searchResults, setSearchResults] = useState<ProductClassification[] | null>(null)
  const fetchedRef = useRef(false)
  const fetchData = useCallback(async () => {
    try {
      const res = await getAllClassifications(1, 50)
      setClassifications(res.data)
      setTotal(res.total)
    } catch {
      toast.error('Error al cargar clasificaciones')
    }
  }, [])

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.push('/')
  }, [user, loading, isAdmin, router])

  useEffect(() => {
    if (isAdmin && !fetchedRef.current) {
      fetchedRef.current = true
      fetchData()
    }
  }, [isAdmin, fetchData])

  useEffect(() => {
    if (!searchQuery.trim()) return

    searchActiveRef.current = true
    const timer = setTimeout(async () => {
      try {
        const results = await searchClassifications(searchQuery.trim())
        if (searchActiveRef.current) setSearchResults(results)
      } catch {
        if (searchActiveRef.current) setSearchResults([])
      }
    }, 300)

    return () => {
      searchActiveRef.current = false
      clearTimeout(timer)
    }
  }, [searchQuery])

  const handleEdit = (item: ProductClassification) => {
    setEditing(item)
    setFormData({
      name: item.name,
      category: item.category,
      aliases: item.aliases.join(', '),
    })
    setShowForm(true)
  }

  const handleNew = () => {
    setEditing(null)
    setFormData({ name: '', category: '', aliases: '' })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.category) return
    setSaving(true)
    try {
      const aliases = formData.aliases.split(',').map((a) => a.trim()).filter(Boolean)
      if (editing) {
        await updateClassification(editing._id, { name: formData.name, category: formData.category, aliases })
        toast.success('Clasificación actualizada')
      } else {
        await createClassification({ name: formData.name, category: formData.category, aliases })
        toast.success('Clasificación creada')
      }
      setShowForm(false)
      setEditing(null)
      fetchData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta clasificación?')) return
    try {
      await deleteClassification(id)
      toast.success('Clasificación eliminada')
      fetchData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  const displayList = searchResults ?? classifications

  if (loading || !user || !isAdmin) return null

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clasificación de productos</h1>
          <p className="text-gray-500 text-sm">{total} productos clasificados</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-green-500"
          />
        </div>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
        >
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border p-6 mb-6 space-y-4">
          <h3 className="font-semibold text-gray-900">
            {editing ? 'Editar clasificación' : 'Nueva clasificación'}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Producto *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                placeholder="Ej: papa"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Categoría *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 bg-white"
              >
                <option value="">Seleccionar</option>
                {(Object.entries(CATEGORY_LABELS) as [string, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Alias (separados por coma)</label>
              <input
                type="text"
                value={formData.aliases}
                onChange={(e) => setFormData((p) => ({ ...p, aliases: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                placeholder="patata, papas"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowForm(false); setEditing(null) }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formData.name || !formData.category}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Producto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Categoría</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Alias</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Activo</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayList.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 capitalize">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] || item.category}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {item.aliases?.join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.active ? (
                      <Check className="h-4 w-4 text-green-500 inline" />
                    ) : (
                      <X className="h-4 w-4 text-red-400 inline" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {displayList.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No se encontraron clasificaciones
          </div>
        )}
      </div>
    </div>
  )
}
