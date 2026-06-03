'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { useAuth } from '@/contexts/auth-context'
import {
  DEFAULT_COUNTRY_CODE,
  getCountryConfig,
  getCountryOptions,
  getOfficialPostalWebsite,
  getPostalCodesForMunicipality,
  type PostalCodeEntry,
} from '@/config/location-catalog'
import type { ProductLocation } from '@/types/product'
import { MapPin, Plus, X, Search } from 'lucide-react'
import { FALLBACK_ENABLED_COUNTRY_CODES } from '@/config/location-catalog'
import { getSiteConfig } from '@/services/site-config-service'

interface LocationFormArrayProps {
  locations: ProductLocation[]
  onChange: (locations: ProductLocation[]) => void
}

export default function LocationFormArray({ locations, onChange }: LocationFormArrayProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [enabledCountryCodes, setEnabledCountryCodes] = useState<string[]>(FALLBACK_ENABLED_COUNTRY_CODES)
  const [cpModalIndex, setCpModalIndex] = useState<number | null>(null)
  const [cpResults, setCpResults] = useState<PostalCodeEntry[]>([])
  const [cpLoading, setCpLoading] = useState(false)
  const [showUserLocations, setShowUserLocations] = useState(false)

  const countryOptions = getCountryOptions(enabledCountryCodes)
  const defaultCountryCode = countryOptions.some(
    (c) => c.code === DEFAULT_COUNTRY_CODE,
  )
    ? DEFAULT_COUNTRY_CODE
    : (countryOptions[0]?.code ?? DEFAULT_COUNTRY_CODE)

  useEffect(() => {
    let mounted = true
    getSiteConfig()
      .then((config) => {
        if (!mounted) return
        const fromAdmin = (config.enabledCountries ?? [])
          .map((code) => code.trim().toUpperCase())
          .filter(Boolean)
        if (fromAdmin.length > 0) setEnabledCountryCodes(fromAdmin)
      })
      .catch(() => null)
    return () => { mounted = false }
  }, [])

  const updateLocation = (index: number, field: keyof ProductLocation, value: string) => {
    const updated = locations.map((loc, i) =>
      i === index ? { ...loc, [field]: value } : loc,
    )
    onChange(updated)
  }

  const addLocation = () => {
    onChange([
      ...locations,
      {
        name: '',
        country: defaultCountryCode,
        province: '',
        municipality: '',
        community: '',
        postalCode: '',
      },
    ])
  }

  const removeLocation = (index: number) => {
    if (locations.length <= 1) return
    onChange(locations.filter((_, i) => i !== index))
  }

  const openCpModal = async (index: number) => {
    const loc = locations[index]
    setCpModalIndex(index)
    setCpLoading(true)
    try {
      const results = await getPostalCodesForMunicipality(
        loc.country || defaultCountryCode,
        loc.municipality,
      )
      setCpResults(results)
    } catch {
      setCpResults([])
    } finally {
      setCpLoading(false)
    }
  }

  const selectPostalCode = (index: number, code: string) => {
    updateLocation(index, 'postalCode', code)
    setCpModalIndex(null)
  }

  const addUserLocation = (userLoc: ProductLocation) => {
    onChange([...locations, userLoc])
    setShowUserLocations(false)
  }

  const resolvedCountry = (index: number) => {
    const c = locations[index]?.country || defaultCountryCode
    const valid = countryOptions.some((co) => co.code === c)
    return valid ? c : defaultCountryCode
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">{t('newProduct.locationSection')}</h2>
        <div className="flex gap-2">
          {user && user.locations && user.locations.length > 0 && (
            <button
              type="button"
              onClick={() => setShowUserLocations(!showUserLocations)}
              className="flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-700 border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-50 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5" />
              {t('newProduct.useMyLocations') || 'Mis ubicaciones'}
            </button>
          )}
          <button
            type="button"
            onClick={addLocation}
            className="flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-700 border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('newProduct.addLocation') || 'Agregar ubicacion'}
          </button>
        </div>
      </div>

      {showUserLocations && user?.locations && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
          <p className="text-xs font-medium text-green-800">Seleccioná una ubicación guardada:</p>
          {user.locations.map((loc, i) => (
            <button
              key={i}
              type="button"
              onClick={() => addUserLocation({
                name: loc.name,
                country: loc.country || defaultCountryCode,
                province: loc.province,
                municipality: loc.municipality,
                community: loc.community,
                postalCode: '',
              })}
              className="w-full text-left bg-white rounded-lg p-2.5 text-sm hover:border-green-400 border border-transparent transition-colors"
            >
              <span className="font-medium">{loc.name}</span>
              <span className="text-gray-500 ml-2">
                {loc.municipality}, {loc.province} {loc.country ? `(${loc.country})` : ''}
              </span>
            </button>
          ))}
        </div>
      )}

      {locations.map((loc, index) => {
        const countryCode = resolvedCountry(index)
        const config = getCountryConfig(countryCode, enabledCountryCodes)
        const regionOptions = Object.keys(config.regions)
        const municipalityOptions = config.regions[loc.province] ?? []
        const isDefault = locations.length <= 1

        return (
          <div
            key={index}
            className="bg-white rounded-2xl border p-5 space-y-3 relative"
          >
            {!isDefault && (
              <button
                type="button"
                onClick={() => removeLocation(index)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center transition-colors"
                aria-label="Eliminar ubicación"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
              <MapPin className="h-3.5 w-3.5" />
              {t('newProduct.locationNumber') || `Ubicación ${index + 1}`}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('newProduct.locationName')} *
              </label>
              <input
                value={loc.name}
                onChange={(e) => updateLocation(index, 'name', e.target.value)}
                placeholder="Ej: Finca El Roble"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">País *</label>
              <select
                value={countryCode === defaultCountryCode && !loc.country ? '' : loc.country || defaultCountryCode}
                onChange={(e) => {
                  const newCountry = e.target.value
                  updateLocation(index, 'country', newCountry)
                  updateLocation(index, 'province', '')
                  updateLocation(index, 'municipality', '')
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white"
              >
                {countryOptions.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {config.regionLabel} *
                </label>
                <input
                  list={`loc-province-${index}`}
                  value={loc.province}
                  onChange={(e) => {
                    updateLocation(index, 'province', e.target.value)
                    updateLocation(index, 'municipality', '')
                  }}
                  placeholder={`Buscar ${config.regionLabel.toLowerCase()}...`}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  required
                />
                <datalist id={`loc-province-${index}`}>
                  {regionOptions.map((r) => <option key={r} value={r} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {config.municipalityLabel} *
                </label>
                <input
                  list={`loc-municipality-${index}`}
                  value={loc.municipality}
                  onChange={(e) => updateLocation(index, 'municipality', e.target.value)}
                  placeholder={`Buscar ${config.municipalityLabel.toLowerCase()}...`}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  required
                />
                <datalist id={`loc-municipality-${index}`}>
                  {municipalityOptions.map((m) => <option key={m} value={m} />)}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('newProduct.community') || 'Distrito / Comunidad'} (opcional)
              </label>
              <input
                value={loc.community || ''}
                onChange={(e) => updateLocation(index, 'community', e.target.value)}
                placeholder="Ej: San Isidro"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {config.postalCodeLabel} (opcional)
              </label>
              <div className="flex gap-2">
                <input
                  value={loc.postalCode || ''}
                  onChange={(e) => updateLocation(index, 'postalCode', e.target.value)}
                  placeholder="Ej: 15000"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
                <button
                  type="button"
                  onClick={() => openCpModal(index)}
                  className="flex items-center gap-1 px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Search className="h-4 w-4" />
                  {t('newProduct.findPostalCode') || 'Buscar CP'}
                </button>
              </div>
            </div>
          </div>
        )
      })}

      {/* Postal code search modal */}
      {cpModalIndex !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                {t('newProduct.postalCodeModal') || 'Códigos postales'}
              </h3>
              <button type="button" onClick={() => setCpModalIndex(null)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {cpLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" />
              </div>
            ) : cpResults.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 mb-3">
                  {t('newProduct.postalCodeSelect') || 'Seleccioná un código postal:'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {cpResults.map((entry, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectPostalCode(cpModalIndex, entry.code)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-center hover:border-green-400 hover:bg-green-50 transition-colors"
                    >
                      {entry.code}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-3">
                  {t('newProduct.postalCodeNotFound') || 'No encontramos códigos postales para esta localidad'}
                </p>
                {locations[cpModalIndex] && (
                  <a
                    href={getOfficialPostalWebsite(locations[cpModalIndex].country || defaultCountryCode) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 text-sm hover:underline"
                  >
                    {t('newProduct.postalCodeWebsite') || 'Consultar sitio oficial →'}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
