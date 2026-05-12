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
import { Upload, X, Leaf } from 'lucide-react'
import { useEffect } from 'react'

const schema = z.object({
  title: z.string().min(3, 'Minimo 3 caracteres'),
  description: z.string().min(10, 'Minimo 10 caracteres'),
  category: z.string().min(1, 'Selecciona una categoria'),
  quantity: z.string().min(1, 'Ingresa la cantidad'),
  unit: z.string().min(1, 'Selecciona la unidad'),
  locationName: z.string().min(1, 'Nombre del lugar requerido'),
  locationProvince: z.string().min(1, 'Provincia requerida'),
  locationMunicipality: z.string().min(1, 'Municipio requerido'),
  lookingFor: z.string().optional(),
  isOrganic: z.boolean().optional(),
  harvestDate: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewProductPage() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5)
    setImages(files)
    setPreviews(files.map((f) => URL.createObjectURL(f)))
  }

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i))
    setPreviews((prev) => prev.filter((_, idx) => idx !== i))
  }

  const onSubmit = async (data: FormData) => {
    try {
      const form = new FormData()
      form.append('title', data.title)
      form.append('description', data.description)
      form.append('category', data.category)
      form.append('quantity', String(data.quantity))
      form.append('unit', data.unit)
      form.append('location[name]', data.locationName)
      form.append('location[province]', data.locationProvince)
      form.append('location[municipality]', data.locationMunicipality)
      if (data.lookingFor) form.append('lookingFor', data.lookingFor)
      if (data.isOrganic) form.append('isOrganic', 'true')
      if (data.harvestDate) form.append('harvestDate', data.harvestDate)
      images.forEach((img) => form.append('images', img))

      await createProduct(form)
      toast.success(t('newProduct.success'))
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.message || t('newProduct.error'))
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
          <div className="flex flex-wrap gap-3 mb-3">
            {previews.map((src, i) => (
              <div key={i} className="relative w-20 h-20">
                <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {previews.length < 5 && (
              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-green-400 transition-colors">
                <Upload className="h-5 w-5 text-gray-400" />
                <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
              </label>
            )}
          </div>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('locations.province')} *</label>
              <input {...register('locationProvince')} placeholder="Ej: Mendoza" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
              {errors.locationProvince && <p className="text-red-500 text-xs mt-1">{errors.locationProvince.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('locations.municipality')} *</label>
              <input {...register('locationMunicipality')} placeholder="Ej: Lujan de Cuyo" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
              {errors.locationMunicipality && <p className="text-red-500 text-xs mt-1">{errors.locationMunicipality.message}</p>}
            </div>
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
