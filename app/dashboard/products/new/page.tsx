'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { createProduct } from '@/services/product-service'
import { CATEGORY_LABELS, UNIT_OPTIONS } from '@/types/product'
import { toast } from 'sonner'
import { Upload, Leaf } from 'lucide-react'
import { useEffect } from 'react'
import ProductImageUpload, { type ImageEntry } from '@/components/products/ProductImageUpload'
import { getSiteConfig } from '@/services/site-config-service'
import {
  DEFAULT_COUNTRY_CODE,
  FALLBACK_ENABLED_COUNTRY_CODES,
  getCountryConfig,
  getCountryOptions,
  isCountryCodeEnabled,
  getMunicipalityOptions,
  getRegionOptions,
} from '@/config/location-catalog'

const schema = z.object({
  title: z.string().min(3, 'Minimo 3 caracteres'),
  description: z.string().min(10, 'Minimo 10 caracteres'),
  category: z.string().min(1, 'Selecciona una categoria'),
  quantity: z.string().min(1, 'Ingresa la cantidad'),
  unit: z.string().min(1, 'Selecciona la unidad'),
  locationName: z.string().min(1, 'Nombre del lugar requerido'),
  locationCountry: z.string().min(1, 'Pais requerido'),
  locationProvince: z.string().min(1, 'Provincia requerida'),
  locationMunicipality: z.string().min(1, 'Municipio requerido'),
  locationPostalCode: z.string().optional(),
  lookingFor: z.string().optional(),
  isOrganic: z.boolean().optional(),
  harvestDate: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewProductPage() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [imageEntries, setImageEntries] = useState<ImageEntry[]>([])
  const [enabledCountryCodes, setEnabledCountryCodes] = useState<string[]>(
    FALLBACK_ENABLED_COUNTRY_CODES,
  )

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      locationCountry: DEFAULT_COUNTRY_CODE,
    },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedCountry = watch('locationCountry') || DEFAULT_COUNTRY_CODE
  const selectedProvince = watch('locationProvince') || ''
  const selectedMunicipality = watch('locationMunicipality') || ''
  const countryOptions = getCountryOptions(enabledCountryCodes)
  const defaultCountryCode = countryOptions.some(
    (country) => country.code === DEFAULT_COUNTRY_CODE,
  )
    ? DEFAULT_COUNTRY_CODE
    : (countryOptions[0]?.code ?? DEFAULT_COUNTRY_CODE)
  const resolvedSelectedCountry = countryOptions.some(
    (country) => country.code === selectedCountry,
  )
    ? selectedCountry
    : defaultCountryCode
  const countryConfig = getCountryConfig(resolvedSelectedCountry, enabledCountryCodes)
  const regionOptions = getRegionOptions(resolvedSelectedCountry)
  const municipalityOptions = getMunicipalityOptions(resolvedSelectedCountry, selectedProvince)

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  useEffect(() => {
    let isMounted = true

    getSiteConfig()
      .then((config) => {
        if (!isMounted) return
        const fromAdmin = (config.enabledCountries ?? [])
          .map((code) => code.trim().toUpperCase())
          .filter(Boolean)
        if (fromAdmin.length > 0) setEnabledCountryCodes(fromAdmin)
      })
      .catch(() => null)

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!isCountryCodeEnabled(selectedCountry, enabledCountryCodes)) {
      setValue('locationCountry', defaultCountryCode)
    }
  }, [selectedCountry, enabledCountryCodes, defaultCountryCode, setValue])

  useEffect(() => {
    setValue('locationProvince', '')
    setValue('locationMunicipality', '')
  }, [resolvedSelectedCountry, setValue])

  useEffect(() => {
    const validMunicipalities = getMunicipalityOptions(
      resolvedSelectedCountry,
      selectedProvince,
    )
    if (selectedMunicipality && !validMunicipalities.includes(selectedMunicipality)) {
      setValue('locationMunicipality', '')
    }
  }, [resolvedSelectedCountry, selectedProvince, selectedMunicipality, setValue])

  const onSubmit = async (data: FormData) => {
    try {
      const form = new FormData()
      form.append('title', data.title)
      form.append('description', data.description)
      form.append('category', data.category)
      form.append('quantity', String(data.quantity))
      form.append('unit', data.unit)
      form.append('location[name]', data.locationName)
      form.append('location[country]', data.locationCountry)
      form.append('location[province]', data.locationProvince)
      form.append('location[municipality]', data.locationMunicipality)
      if (data.locationPostalCode) form.append('location[postalCode]', data.locationPostalCode)
      if (data.lookingFor) form.append('lookingFor', data.lookingFor)
      if (data.isOrganic) form.append('isOrganic', 'true')
      if (data.harvestDate) form.append('harvestDate', data.harvestDate)
      imageEntries.forEach((entry) => form.append('images', entry.file))
      form.append('imagePositions', JSON.stringify(imageEntries.map((e) => e.objectPosition)))

      await createProduct(form)
      toast.success(t('newProduct.success'))
      router.push('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : t('newProduct.error'))
    }
  }

  if (loading || !user) return null

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('newProduct.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('newProduct.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Imagenes */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="h-4 w-4" /> {t('newProduct.photos')}
          </h2>
          <ProductImageUpload maxImages={5} onChange={setImageEntries} />
        </div>

        {/* Info basica */}
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{t('newProduct.productInfo')}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('newProduct.titleLabel')} *</label>
            <input {...register('title')} placeholder={t('newProduct.titlePlaceholder')} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('newProduct.descriptionLabel')} *</label>
            <textarea {...register('description')} rows={3} placeholder={t('newProduct.descriptionPlaceholder')} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 resize-none" />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('newProduct.category')} *</label>
              <select {...register('category')} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                <option value="">{t('common.select')}</option>
                {(Object.entries(CATEGORY_LABELS) as [string, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('newProduct.unit')} *</label>
              <select {...register('unit')} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                <option value="">{t('common.select')}</option>
                {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('newProduct.quantity')} *</label>
            <input {...register('quantity')} type="number" step="0.1" min="0" placeholder="Ej: 50" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
            {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('newProduct.lookingFor')}</label>
            <input {...register('lookingFor')} placeholder={t('newProduct.lookingForPlaceholder')} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...register('isOrganic')} type="checkbox" className="rounded border-gray-300 text-green-600" />
              <span className="text-sm text-gray-700 flex items-center gap-1">
                <Leaf className="h-4 w-4 text-green-600" /> {t('newProduct.organic')}
              </span>
            </label>
            <div className="flex-1">
              <input {...register('harvestDate')} type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500" />
              <p className="text-xs text-gray-400 mt-0.5">{t('newProduct.harvestDate')}</p>
            </div>
          </div>
        </div>

        {/* Ubicacion */}
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{t('newProduct.locationSection')}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('newProduct.locationName')} *</label>
            <input {...register('locationName')} placeholder="Ej: Finca El Roble" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
            {errors.locationName && <p className="text-red-500 text-xs mt-1">{errors.locationName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pais *</label>
            <select {...register('locationCountry')} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
              {countryOptions.map((country) => (
                <option key={country.code} value={country.code}>{country.name}</option>
              ))}
            </select>
            {errors.locationCountry && <p className="text-red-500 text-xs mt-1">{errors.locationCountry.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{countryConfig.regionLabel} *</label>
              <input list="province-options" {...register('locationProvince')} placeholder={`Buscar ${countryConfig.regionLabel.toLowerCase()}...`} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
              <datalist id="province-options">
                {regionOptions.map((region) => <option key={region} value={region} />)}
              </datalist>
              {errors.locationProvince && <p className="text-red-500 text-xs mt-1">{errors.locationProvince.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{countryConfig.municipalityLabel} *</label>
              <input list="municipality-options" {...register('locationMunicipality')} placeholder={`Buscar ${countryConfig.municipalityLabel.toLowerCase()}...`} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
              <datalist id="municipality-options">
                {municipalityOptions.map((municipality) => <option key={municipality} value={municipality} />)}
              </datalist>
              {errors.locationMunicipality && <p className="text-red-500 text-xs mt-1">{errors.locationMunicipality.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{countryConfig.postalCodeLabel} (opcional)</label>
            <input {...register('locationPostalCode')} placeholder="Ej: 5500" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
        >
          {isSubmitting ? t('newProduct.publishing') : t('newProduct.submit')}
        </button>
      </form>
    </div>
  )
}
