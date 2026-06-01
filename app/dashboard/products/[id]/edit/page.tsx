'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { getProduct, updateProduct, removeProductImage } from '@/services/product-service'
import { CATEGORY_LABELS, UNIT_OPTIONS, type Product } from '@/types/product'
import { toast } from 'sonner'
import { ArrowLeft, Upload, Leaf, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import ProductImageUpload, { type ImageEntry } from '@/components/products/ProductImageUpload'
import { getSiteConfig } from '@/services/site-config-service'
import {
  DEFAULT_COUNTRY_CODE,
  FALLBACK_ENABLED_COUNTRY_CODES,
  getCountryConfig,
  getCountryOptions,
  getMunicipalityOptions,
  getRegionOptions,
  isCountryCodeEnabled,
} from '@/config/location-catalog'

const schema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres'),
  description: z.string().min(10, 'Mínimo 10 caracteres'),
  category: z.string().min(1, 'Seleccioná una categoría'),
  quantity: z.string().min(1, 'Ingresá la cantidad'),
  unit: z.string().min(1, 'Seleccioná la unidad'),
  locationName: z.string().min(1, 'Nombre del lugar requerido'),
  locationCountry: z.string().min(1, 'Pais requerido'),
  locationProvince: z.string().min(1, 'Provincia requerida'),
  locationMunicipality: z.string().min(1, 'Municipio requerido'),
  locationPostalCode: z.string().optional(),
  isOrganic: z.boolean().optional(),
  harvestDate: z.string().optional(),
  status: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [fetching, setFetching] = useState(true)
  const [newImageEntries, setNewImageEntries] = useState<ImageEntry[]>([])
  const [removingImage, setRemovingImage] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showOtros, setShowOtros] = useState(false)
  const [otrosText, setOtrosText] = useState('')
  const [enabledCountryCodes, setEnabledCountryCodes] = useState<string[]>(
    FALLBACK_ENABLED_COUNTRY_CODES,
  )
  const previousCountryRef = useRef<string | null>(null)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
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
    getProduct(id)
      .then((p) => {
        setProduct(p)
        const categories: string[] = []
        const otros: string[] = []
        const validCategories = Object.keys(CATEGORY_LABELS)
        p.lookingFor?.forEach((val) => {
          if (validCategories.includes(val)) {
            categories.push(val)
          } else {
            otros.push(val)
          }
        })
        setSelectedCategories(categories)
        if (otros.length > 0) {
          setShowOtros(true)
          setOtrosText(otros.join(', '))
        }
        reset({
          title: p.title,
          description: p.description,
          category: p.category,
          quantity: String(p.quantity),
          unit: p.unit,
          locationName: p.location.name,
          locationCountry: p.location.country || DEFAULT_COUNTRY_CODE,
          locationProvince: p.location.province,
          locationMunicipality: p.location.municipality,
          locationPostalCode: p.location.postalCode || '',
          isOrganic: p.isOrganic,
          harvestDate: p.harvestDate ? p.harvestDate.split('T')[0] : '',
          status: p.status,
        })
      })
      .catch(() => toast.error('Producto no encontrado'))
      .finally(() => setFetching(false))
  }, [id, reset])

  // Redirect if not owner
  useEffect(() => {
    if (!fetching && product && user) {
      const owner = typeof product.owner === 'object' ? product.owner : null
      if (owner && owner._id !== user._id) {
        toast.error('No tenés permiso para editar este producto')
        router.push('/dashboard')
      }
    }
  }, [fetching, product, user, router])

  useEffect(() => {
    if (!isCountryCodeEnabled(selectedCountry, enabledCountryCodes)) {
      setValue('locationCountry', defaultCountryCode)
    }
  }, [selectedCountry, enabledCountryCodes, defaultCountryCode, setValue])

  useEffect(() => {
    if (previousCountryRef.current === null) {
      previousCountryRef.current = resolvedSelectedCountry
      return
    }

    if (previousCountryRef.current !== resolvedSelectedCountry) {
      setValue('locationProvince', '')
      setValue('locationMunicipality', '')
      previousCountryRef.current = resolvedSelectedCountry
    }
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

  const handleRemoveExistingImage = async (publicId: string) => {
    if (!product) return
    setRemovingImage(publicId)
    try {
      const updated = await removeProductImage(product._id, publicId)
      setProduct(updated)
      toast.success('Imagen eliminada')
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : 'Error al eliminar imagen')
    } finally {
      setRemovingImage(null)
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!product) return
    try {
      const form = new FormData()
      form.append('title', data.title)
      form.append('description', data.description)
      form.append('category', data.category)
      form.append('quantity', String(data.quantity))
      form.append('unit', data.unit)
      form.append('location[name]', data.locationName)
      form.append('location[country]', resolvedSelectedCountry)
      form.append('location[province]', data.locationProvince)
      form.append('location[municipality]', data.locationMunicipality)
      if (data.locationPostalCode) form.append('location[postalCode]', data.locationPostalCode)
      const lookingForValues = [...selectedCategories]
      if (otrosText.trim()) lookingForValues.push(otrosText.trim())
      lookingForValues.forEach((val) => form.append('lookingFor', val))
      if (data.isOrganic) form.append('isOrganic', 'true')
      if (data.harvestDate) form.append('harvestDate', data.harvestDate)
      if (data.status) form.append('status', data.status)
      newImageEntries.forEach((entry) => form.append('images', entry.file))
      form.append('imagePositions', JSON.stringify(newImageEntries.map((e) => e.objectPosition)))

      await updateProduct(product._id, form)
      toast.success('Producto actualizado!')
      router.push('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : 'Error al actualizar')
    }
  }

  if (loading || fetching || !product) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
    </div>
  )

  const maxNewImages = 5 - (product.images?.length || 0)

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> Volver al panel
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar producto</h1>
        <p className="text-gray-500 text-sm mt-1">Modificá los datos de tu publicación</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Fotos */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="h-4 w-4" /> Fotos
          </h2>

          {/* Existing images */}
          {product.images && product.images.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2 font-medium">Imágenes actuales</p>
              <div className="flex flex-wrap gap-3">
                {product.images.map((img) => (
                  <div key={img.publicId} className="relative w-20 h-20">
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      className="object-cover rounded-xl"
                      style={{ objectPosition: img.objectPosition || 'center center' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(img.publicId)}
                      disabled={removingImage === img.publicId}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs disabled:opacity-60"
                    >
                      {removingImage === img.publicId ? (
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="h-2.5 w-2.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New images with position preview */}
          {maxNewImages > 0 && (
            <div>
              {product.images && product.images.length > 0 && (
                <p className="text-xs text-gray-500 mb-2 font-medium">Agregar imágenes nuevas</p>
              )}
              <ProductImageUpload maxImages={maxNewImages} onChange={setNewImageEntries} />
            </div>
          )}
        </div>

        {/* Info básica */}
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Información del producto</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input {...register('title')} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea {...register('description')} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 resize-none" />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
              <select {...register('category')} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                <option value="">Seleccionar</option>
                {(Object.entries(CATEGORY_LABELS) as [string, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad *</label>
              <select {...register('unit')} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                <option value="">Seleccionar</option>
                {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad disponible *</label>
              <input {...register('quantity')} type="number" step="0.1" min="0" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
              {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select {...register('status')} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                <option value="available">Disponible</option>
                <option value="reserved">Reservado</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Qué buscás a cambio (opcional)</label>
            <p className="text-xs text-gray-400 mb-2">Seleccioná las categorías que te interesan</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(CATEGORY_LABELS) as [string, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-200 has-[:checked]:border-green-400 has-[:checked]:bg-green-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories((prev) => [...prev, key])
                      } else {
                        setSelectedCategories((prev) => prev.filter((c) => c !== key))
                      }
                    }}
                    className="rounded border-gray-300 text-green-600"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOtros}
                  onChange={(e) => {
                    setShowOtros(e.target.checked)
                    if (!e.target.checked) setOtrosText('')
                  }}
                  className="rounded border-gray-300 text-green-600"
                />
                <span className="text-sm text-gray-700">Otros (especificar)</span>
              </label>
              {showOtros && (
                <input
                  type="text"
                  value={otrosText}
                  onChange={(e) => setOtrosText(e.target.value)}
                  placeholder="Ej: legumbres, frutos secos..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              )}
            </div>
            {(selectedCategories.length > 0 || otrosText.trim()) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[...selectedCategories, ...(otrosText.trim() ? [otrosText.trim()] : [])].map((val) => (
                  <span key={val} className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    {CATEGORY_LABELS[val as keyof typeof CATEGORY_LABELS] || val}
                    <button
                      type="button"
                      onClick={() => {
                        if (CATEGORY_LABELS[val as keyof typeof CATEGORY_LABELS]) {
                          setSelectedCategories((prev) => prev.filter((c) => c !== val))
                        } else {
                          setOtrosText('')
                          setShowOtros(false)
                        }
                      }}
                      className="ml-0.5 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...register('isOrganic')} type="checkbox" className="rounded border-gray-300 text-green-600" />
              <span className="text-sm text-gray-700 flex items-center gap-1">
                <Leaf className="h-4 w-4 text-green-600" /> Producto orgánico
              </span>
            </label>
            <div className="flex-1">
              <input {...register('harvestDate')} type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500" />
              <p className="text-xs text-gray-400 mt-0.5">Fecha de cosecha (opcional)</p>
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Ubicación del producto</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del lugar *</label>
            <input {...register('locationName')} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
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
              <input list="edit-province-options" {...register('locationProvince')} placeholder={`Buscar ${countryConfig.regionLabel.toLowerCase()}...`} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
              <datalist id="edit-province-options">
                {regionOptions.map((region) => <option key={region} value={region} />)}
              </datalist>
              {errors.locationProvince && <p className="text-red-500 text-xs mt-1">{errors.locationProvince.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{countryConfig.municipalityLabel} *</label>
              <input list="edit-municipality-options" {...register('locationMunicipality')} placeholder={`Buscar ${countryConfig.municipalityLabel.toLowerCase()}...`} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
              <datalist id="edit-municipality-options">
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

        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="flex-1 text-center rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}


