'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { getSiteConfig, updateSiteConfig, uploadLogo } from '@/services/site-config-service'
import type { SiteConfig } from '@/types/site-config'
import {
  FALLBACK_ENABLED_COUNTRY_CODES,
  getCountryOptions,
} from '@/config/location-catalog'
import { toast } from 'sonner'
import { Save, Upload, Sprout } from 'lucide-react'
import Image from 'next/image'

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error && err.message) return err.message
  return fallback
}

const GENERAL_FIELDS: Array<{
  key: 'siteName' | 'siteSlogan' | 'contactEmail' | 'contactPhone'
  label: string
  placeholder: string
}> = [
  { key: 'siteName', label: 'Nombre del sitio', placeholder: 'Trueque del Campo' },
  { key: 'siteSlogan', label: 'Eslogan', placeholder: 'Intercambia lo que cosechas' },
  { key: 'contactEmail', label: 'Email de contacto', placeholder: 'contacto@trueque.com' },
  { key: 'contactPhone', label: 'Telefono de contacto', placeholder: '+54 9 11...' },
]

const SOCIAL_FIELDS: Array<{
  key: 'facebookUrl' | 'instagramUrl' | 'whatsappNumber'
  label: string
  placeholder: string
}> = [
  { key: 'facebookUrl', label: 'Facebook URL', placeholder: 'https://facebook.com/...' },
  { key: 'instagramUrl', label: 'Instagram URL', placeholder: 'https://instagram.com/...' },
  { key: 'whatsappNumber', label: 'WhatsApp (numero)', placeholder: '5491112345678' },
]

const COLOR_FIELDS: Array<{
  key: 'primaryColor' | 'secondaryColor'
  label: string
}> = [
  { key: 'primaryColor', label: 'Color primario' },
  { key: 'secondaryColor', label: 'Color secundario' },
]

export default function AdminConfigPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [config, setConfig] = useState<SiteConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const allCountryOptions = getCountryOptions(FALLBACK_ENABLED_COUNTRY_CODES)

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.push('/')
  }, [user, loading, isAdmin, router])

  useEffect(() => {
    if (!isAdmin) return

    getSiteConfig()
      .then((incoming) => {
        const enabledCountries =
          incoming.enabledCountries && incoming.enabledCountries.length > 0
            ? incoming.enabledCountries
            : FALLBACK_ENABLED_COUNTRY_CODES

        setConfig({
          ...incoming,
          enabledCountries,
        })
      })
      .catch(() => null)
  }, [isAdmin])

  const handleChange = <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => {
    setConfig((prev) => prev ? { ...prev, [key]: value } : prev)
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const toggleCountry = (countryCode: string) => {
    if (!config) return

    const current = config.enabledCountries ?? []
    const exists = current.includes(countryCode)
    const next = exists
      ? current.filter((code) => code !== countryCode)
      : [...current, countryCode]

    handleChange('enabledCountries', next)
  }

  const handleSave = async () => {
    if (!config) return
    if (!config.enabledCountries || config.enabledCountries.length === 0) {
      toast.error('Debes habilitar al menos un pais')
      return
    }

    setSaving(true)
    try {
      if (logoFile) {
        const updated = await uploadLogo(logoFile)
        setConfig(updated)
        setLogoFile(null)
        toast.success('Logo actualizado')
      }

      const { ...rest } = config

      const payload = {
        siteName: rest.siteName,
        siteSlogan: rest.siteSlogan,
        contactEmail: rest.contactEmail,
        contactPhone: rest.contactPhone,
        primaryColor: rest.primaryColor,
        secondaryColor: rest.secondaryColor,
        facebookUrl: rest.facebookUrl,
        instagramUrl: rest.instagramUrl,
        whatsappNumber: rest.whatsappNumber,
        aboutText: rest.aboutText,
        allowRegistrations: rest.allowRegistrations,
        enabledCountries: rest.enabledCountries,
        legalVersion: rest.legalVersion,
      }

      await updateSiteConfig(payload)
      toast.success('Configuracion guardada')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Error al guardar'))
    } finally {
      setSaving(false)
    }
  }

  if (loading || !config) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent" />
    </div>
  )

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuracion del sitio</h1>
          <p className="text-gray-500 text-sm mt-1">Personalizacion de la plataforma</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Logo */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Logo del sitio</h2>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 relative">
              {logoPreview || config.logo?.url ? (
                <Image src={logoPreview || config.logo.url} alt="logo" fill className="object-contain p-2" />
              ) : (
                <Sprout className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <label className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload className="h-4 w-4" /> Subir logo
                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </label>
              <p className="text-xs text-gray-400 mt-1">PNG, SVG o JPG. Recomendado: fondo transparente.</p>
            </div>
          </div>
        </div>

        {/* Info general */}
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Informacion general</h2>
          {GENERAL_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                value={config[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texto de la seccion Sobre nosotros</label>
            <textarea
              value={config.aboutText || ''}
              onChange={(e) => handleChange('aboutText', e.target.value)}
              rows={4}
              placeholder="Describe el proposito de la plataforma..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 resize-none"
            />
          </div>
        </div>

        {/* Redes sociales */}
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Redes sociales</h2>
          {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                value={config[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>
          ))}
        </div>

        {/* Colores */}
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Colores de la marca</h2>
          <div className="grid grid-cols-2 gap-4">
            {COLOR_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <input
                  type="color"
                  value={config[key] || '#2d6a4f'}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer p-1"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{config[key]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuracion */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Configuracion</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => handleChange('allowRegistrations', !config.allowRegistrations)}
              className={`relative w-11 h-6 rounded-full transition-colors ${config.allowRegistrations ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.allowRegistrations ? 'translate-x-5' : ''}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Permitir nuevos registros</p>
              <p className="text-xs text-gray-400">Si esta desactivado, nadie nuevo puede registrarse</p>
            </div>
          </label>

          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700 mb-1">Paises habilitados para publicar productos</p>
            <p className="text-xs text-gray-400 mb-3">Solo estos paises apareceran en el formulario de alta de productos.</p>
            <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-200 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allCountryOptions.map((country) => {
                const checked = (config.enabledCountries ?? []).includes(country.code)
                return (
                  <label key={country.code} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCountry(country.code)}
                      className="rounded border-gray-300 text-green-600"
                    />
                    <span className="text-sm text-gray-700">{country.name}</span>
                    <span className="text-xs text-gray-400">({country.code})</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
