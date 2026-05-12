'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { getProduct, updateProduct, removeProductImage } from '@/services/product-service'
import { CATEGORY_LABELS, UNIT_OPTIONS, type Product } from '@/types/product'
import { toast } from 'sonner'
import { ArrowLeft, Upload, X, Leaf, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const schema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres'),
  description: z.string().min(10, 'Mínimo 10 caracteres'),
  category: z.string().min(1, 'Seleccioná una categoría'),
  quantity: z.string().min(1, 'Ingresá la cantidad'),
  unit: z.string().min(1, 'Seleccioná la unidad'),
  locationName: z.string().min(1, 'Nombre del lugar requerido'),
  locationProvince: z.string().min(1, 'Provincia requerida'),
  locationMunicipality: z.string().min(1, 'Municipio requerido'),
  lookingFor: z.string().optional(),
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
  const [newImages, setNewImages] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [removingImage, setRemovingImage] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  useEffect(() => {
    getProduct(id)
      .then((p) => {
        setProduct(p)
        reset({
          title: p.title,
          description: p.description,
          category: p.category,
          quantity: String(p.quantity),
          unit: p.unit,
          locationName: p.location.name,
          locationProvince: p.location.province,
          locationMunicipality: p.location.municipality,
          lookingFor: p.lookingFor?.join(', ') || '',
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

  const handleNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5 - (product?.images.length || 0))
    setNewImages(files)
    setNewPreviews(files.map((f) => URL.createObjectURL(f)))
  }

  const removeNewImage = (i: number) => {
    setNewImages((prev) => prev.filter((_, idx) => idx !== i))
    setNewPreviews((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleRemoveExistingImage = async (publicId: string) => {
    if (!product) return
    setRemovingImage(publicId)
    try {
      const updated = await removeProductImage(product._id, publicId)
      setProduct(updated)
      toast.success('Imagen eliminada')
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar imagen')
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
      form.append('location[province]', data.locationProvince)
      form.append('location[municipality]', data.locationMunicipality)
      if (data.lookingFor) form.append('lookingFor', data.lookingFor)
      if (data.isOrganic) form.append('isOrganic', 'true')
      if (data.harvestDate) form.append('harvestDate', data.harvestDate)
      if (data.status) form.append('status', data.status)
      newImages.forEach((img) => form.append('images', img))

      await updateProduct(product._id, form)
      toast.success('Producto actualizado!')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar')
    }
  }

  if (loading || fetching || !product) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
    </div>
  )

  const totalImages = (product.images?.length || 0) + newPreviews.length

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
        {/* Imágenes existentes */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="h-4 w-4" /> Fotos
          </h2>

          {/* Existing images */}
          {product.images && product.images.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">Imágenes actuales</p>
              <div className="flex flex-wrap gap-3">
                {product.images.map((img) => (
                  <div key={img.publicId} className="relative w-20 h-20">
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      className="object-cover rounded-xl"
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

          {/* New images */}
          {newPreviews.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">Imágenes nuevas</p>
              <div className="flex flex-wrap gap-3">
                {newPreviews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20">
                    <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalImages < 5 && (
            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-green-400 transition-colors">
              <Upload className="h-5 w-5 text-gray-400" />
              <input type="file" accept="image/*" multiple onChange={handleNewImages} className="hidden" />
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Qué buscás a cambio (opcional)</label>
            <input {...register('lookingFor')} placeholder="Ej: frutas, verduras, granos..." className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
              <input {...register('locationProvince')} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
              {errors.locationProvince && <p className="text-red-500 text-xs mt-1">{errors.locationProvince.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Municipio *</label>
              <input {...register('locationMunicipality')} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
              {errors.locationMunicipality && <p className="text-red-500 text-xs mt-1">{errors.locationMunicipality.message}</p>}
            </div>
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
