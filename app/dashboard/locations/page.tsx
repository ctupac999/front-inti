'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { addLocation, removeLocation } from '@/services/user-service'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, MapPin } from 'lucide-react'
import Link from 'next/link'
import {
  FALLBACK_ENABLED_COUNTRY_CODES,
  getCountryConfig,
  getCountryOptions,
  getMunicipalityOptions,
  getRegionOptions,
  DEFAULT_COUNTRY_CODE,
} from '@/config/location-catalog'
import { getSiteConfig } from '@/services/site-config-service'

interface Location {
  _id?: string
  name: string
  country?: string
  province: string
  municipality: string
  community?: string
  coordinates?: { lat: number; lng: number }
}

export default function LocationsPage() {
  const { user, loading, refreshUser } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    country: DEFAULT_COUNTRY_CODE,
    province: '',
    municipality: '',
    community: '',
  })
  const [saving, setSaving] = useState(false)
  const [enabledCountryCodes, setEnabledCountryCodes] = useState<string[]>(
    FALLBACK_ENABLED_COUNTRY_CODES,
  )

  const locations = (user?.locations || []) as Location[]
  const countryOptions = getCountryOptions(enabledCountryCodes)
  const resolvedCountry = countryOptions.some((c) => c.code === form.country)
    ? form.country
    : DEFAULT_COUNTRY_CODE
  const config = getCountryConfig(resolvedCountry, enabledCountryCodes)
  const regionOptions = getRegionOptions(resolvedCountry)
  const municipalityOptions = getMunicipalityOptions(resolvedCountry, form.province)

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  useEffect(() => {
    let mounted = true
    getSiteConfig()
      .then((cfg) => {
        if (!mounted) return
        const fromAdmin = (cfg.enabledCountries ?? [])
          .map((code) => code.trim().toUpperCase())
          .filter(Boolean)
        if (fromAdmin.length > 0) setEnabledCountryCodes(fromAdmin)
      })
      .catch(() => null)
    return () => { mounted = false }
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await addLocation({
        name: form.name,
        country: resolvedCountry,
        province: form.province,
        municipality: form.municipality,
        community: form.community || undefined,
      })
      await refreshUser()
      setForm({
        name: '',
        country: DEFAULT_COUNTRY_CODE,
        province: '',
        municipality: '',
        community: '',
      })
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
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">País</label>
              <select
                value={resolvedCountry}
                onChange={e => {
                  setForm(f => ({ ...f, country: e.target.value, province: '', municipality: '' }))
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 bg-white"
              >
                {countryOptions.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{config.regionLabel}</label>
                <input
                  list="loc-province"
                  placeholder={`Buscar ${config.regionLabel.toLowerCase()}...`}
                  value={form.province}
                  onChange={e => {
                    setForm(f => ({ ...f, province: e.target.value, municipality: '' }))
                  }}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
                />
                <datalist id="loc-province">
                  {regionOptions.map((r) => <option key={r} value={r} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{config.municipalityLabel}</label>
                <input
                  list="loc-municipality"
                  placeholder={`Buscar ${config.municipalityLabel.toLowerCase()}...`}
                  value={form.municipality}
                  onChange={e => setForm(f => ({ ...f, municipality: e.target.value }))}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
                />
                <datalist id="loc-municipality">
                  {municipalityOptions.map((m) => <option key={m} value={m} />)}
                </datalist>
              </div>
            </div>
            <input
              placeholder="Distrito / Comunidad (opcional)"
              value={form.community}
              onChange={e => setForm(f => ({ ...f, community: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
            />
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
                    <p className="text-xs text-gray-500">
                      {loc.municipality}, {loc.province}
                      {loc.country ? ` (${loc.country})` : ''}
                      {loc.community ? ` · ${loc.community}` : ''}
                    </p>
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
