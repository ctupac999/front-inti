'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { addLocation, removeLocation } from '@/services/user-service'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, MapPin } from 'lucide-react'
import Link from 'next/link'

interface Location {
  _id?: string
  name: string
  province: string
  municipality: string
  coordinates?: { lat: number; lng: number }
}

export default function LocationsPage() {
  const { user, loading, refreshUser } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', province: '', municipality: '' })
  const [saving, setSaving] = useState(false)

  const locations = (user?.locations || []) as Location[]

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await addLocation(form)
      await refreshUser()
      setForm({ name: '', province: '', municipality: '' })
      setShowForm(false)
      toast.success(t('locations.added'))
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : 'Error al agregar')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (index: number) => {
    try {
      await removeLocation(index)
      await refreshUser()
      toast.success(t('locations.removed'))
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : 'Error al eliminar')
    }
  }

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-xl mx-auto px-4">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> {t('common.backToPanel')}
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('locations.title')}</h1>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" /> {t('common.add')}
            </button>
          )}
        </div>

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleAdd} className="bg-white rounded-2xl p-5 shadow-sm mb-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">{t('locations.newLocation')}</h2>
            <input
              placeholder={t('locations.namePlaceholder')}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder={t('locations.province')}
                value={form.province}
                onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
              />
              <input
                placeholder={t('locations.municipality')}
                value={form.municipality}
                onChange={e => setForm(f => ({ ...f, municipality: e.target.value }))}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>
        )}

        {/* Locations list */}
        {locations.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-gray-500 shadow-sm">
            <MapPin className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p>{t('locations.noLocations')}</p>
            <p className="text-sm mt-1">{t('locations.addHint')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {locations.map((loc, i) => (
              <div key={loc._id || i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{loc.name}</p>
                    <p className="text-xs text-gray-500">{loc.municipality}, {loc.province}</p>
                  </div>
                </div>
            {(loc._id || i >= 0) && (
                  <button
                    onClick={() => handleRemove(i)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
