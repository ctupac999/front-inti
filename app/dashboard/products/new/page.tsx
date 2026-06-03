'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { createProduct } from '@/services/product-service'
import { CATEGORY_LABELS, UNIT_OPTIONS, type ProductLocation } from '@/types/product'
import { toast } from 'sonner'
import { Upload, Leaf } from 'lucide-react'
import { useEffect } from 'react'
import ProductImageUpload, { type ImageEntry } from '@/components/products/ProductImageUpload'
import ProductClassifier from '@/components/products/ProductClassifier'
import LocationFormArray from '@/components/products/LocationFormArray'

const schema = z.object({
  title: z.string().min(3, 'Minimo 3 caracteres'),
  description: z.string().min(10, 'Minimo 10 caracteres'),
  category: z.string().min(1, 'Selecciona una categoria'),
  quantity: z.string().min(1, 'Ingresa la cantidad'),
  unit: z.string().min(1, 'Selecciona la unidad'),
  isOrganic: z.boolean().optional(),
  harvestDate: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewProductPage() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [imageEntries, setImageEntries] = useState<ImageEntry[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showOtros, setShowOtros] = useState(false)
  const [otrosText, setOtrosText] = useState('')
  const [locations, setLocations] = useState<ProductLocation[]>([
    {
      name: '',
      country: DEFAULT_COUNTRY_CODE,
      province: '',
      municipality: '',
      community: '',
      postalCode: '',
    },
  ])

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  const onSubmit = async (data: FormData) => {
    if (locations.length === 0) {
      toast.error(t('newProduct.locationRequired') || 'Agregá al menos una ubicación')
      return
    }

    const invalidLoc = locations.find(
      (l) => !l.name || !l.province || !l.municipality,
    )
    if (invalidLoc) {
      toast.error(t('newProduct.locationRequired') || 'Completá nombre, provincia y municipio de todas las ubicaciones')
      return
    }

    try {
      const form = new FormData()
      form.append('title', data.title)
      form.append('description', data.description)
      form.append('category', data.category)
      form.append('quantity', String(data.quantity))
      form.append('unit', data.unit)
      form.append('locations', JSON.stringify(locations))
      const lookingForValues = [...selectedCategories]
      if (otrosText.trim()) lookingForValues.push(otrosText.trim())
      lookingForValues.forEach((val) => form.append('lookingFor', val))
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

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-medium text-amber-800 mb-2">🔍 {t('newProduct.classifierTitle')}</p>
            <ProductClassifier
              onSelect={(name, category) => {
                setValue('category', category)
                toast.success(`"${name}" → ${CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}`)
              }}
            />
            <p className="text-xs text-amber-600 mt-1.5">{t('newProduct.classifierHint')}</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('newProduct.lookingFor')}</label>
            <p className="text-xs text-gray-400 mb-2">{t('newProduct.lookingForHint')}</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(CATEGORY_LABELS) as [string, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-200 has-[:checked]:border-green-400 has-[:checked]:bg-green-50 transition-colors">
                  <input
                    type="checkbox"
                    value={key}
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
                <span className="text-sm text-gray-700">{t('newProduct.lookingForOthers')}</span>
              </label>
              {showOtros && (
                <input
                  type="text"
                  value={otrosText}
                  onChange={(e) => setOtrosText(e.target.value)}
                  placeholder={t('newProduct.lookingForOthersPlaceholder')}
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
                <Leaf className="h-4 w-4 text-green-600" /> {t('newProduct.organic')}
              </span>
            </label>
            <div className="flex-1">
              <input {...register('harvestDate')} type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500" />
              <p className="text-xs text-gray-400 mt-0.5">{t('newProduct.harvestDate')}</p>
            </div>
          </div>
        </div>

        {/* Ubicaciones */}
        <LocationFormArray locations={locations} onChange={setLocations} />

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
