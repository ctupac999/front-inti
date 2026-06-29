'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getProduct } from '@/services/product-service'
import { getMyProducts } from '@/services/product-service'
import { proposeTrade } from '@/services/trade-service'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { Product, ProductLocation, CATEGORY_LABELS } from '@/types/product'
import { toast } from 'sonner'
import { MapPin, Leaf, Eye, ArrowLeft, X, PenLine, Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

function getAvailableQty(p: Product): number {
  if (p.status !== 'available') return 0
  return p.quantity - (p.reservedQuantity ?? 0)
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTradeModal, setShowTradeModal] = useState(false)
  const [myProducts, setMyProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [offeredQty, setOfferedQty] = useState('0')
  const [requestedQty, setRequestedQty] = useState('0')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [textOnly, setTextOnly] = useState(false)

  useEffect(() => {
    getProduct(id)
      .then(setProduct)
      .catch(() => toast.error(t('product.notFound')))
      .finally(() => setLoading(false))
  }, [id, t])

  // Auto-abrir modal si vuelve de crear producto
  useEffect(() => {
    if (!user || loading) return
    const returnTo = sessionStorage.getItem('returnTo')
    if (returnTo === `/productos/${id}`) {
      sessionStorage.removeItem('returnTo')
      openTradeModal()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, id])

  const openTradeModal = async () => {
    if (!user) { router.push('/auth/login'); return }
    const prods = await getMyProducts()
    const available = prods.filter(
      (p: Product) => p._id !== id && getAvailableQty(p) > 0,
    )
    setMyProducts(available)
    setSelectedProduct('')
    setOfferedQty('0')
    setRequestedQty(String(product?.quantity ?? 0))
    setMessage('')
    setTextOnly(false)
    setShowTradeModal(true)
  }

  const handleAddProduct = () => {
    sessionStorage.setItem('returnTo', `/productos/${id}`)
    router.push('/dashboard/products/new')
  }

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId)
    const p = myProducts.find((x) => x._id === productId)
    if (p) setOfferedQty(String(getAvailableQty(p)))
  }

  const submitTrade = async () => {
    if (!product) return

    if (textOnly) {
      if (!message.trim()) {
        toast.error(t('product.trade.messageRequired'))
        return
      }
    } else {
      if (!selectedProduct) {
        toast.error(t('product.trade.selectError'))
        return
      }
      if (!offeredQty || Number(offeredQty) <= 0) {
        toast.error(t('product.trade.offeredQuantity'))
        return
      }
      if (!requestedQty || Number(requestedQty) <= 0) {
        toast.error(t('product.trade.requestedQuantity'))
        return
      }
      const selectedP = myProducts.find((p) => p._id === selectedProduct)
      const offeredQtyNum = Number(offeredQty)
      if (selectedP && offeredQtyNum > getAvailableQty(selectedP)) {
        toast.error(t('product.trade.quantityError'))
        return
      }
    }

    setSubmitting(true)
    try {
      const payload = {
        ...(textOnly
          ? {}
          : {
              offeredProduct: selectedProduct,
              offeredQuantity: Number(offeredQty),
            }),
        requestedProduct: id,
        ...(requestedQty && !textOnly ? { requestedQuantity: Number(requestedQty) } : {}),
        message: message.trim() || undefined,
      }
      await proposeTrade(payload)
      toast.success(t('product.trade.success'))
      setShowTradeModal(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      const ERROR_MAP: Record<string, string> = {
        'Requested product not found': 'trade.error.productNotFound',
        'Cannot trade with yourself': 'trade.error.selfTrade',
        'The requested product is not available': 'trade.error.requestedNotAvailable',
        'Offered product not found': 'trade.error.offeredNotFound',
        'You do not own the offered product': 'trade.error.offeredNotOwned',
        'If you do not offer a product, write a message for your proposal': 'trade.error.noMessage',
        'Trade not found': 'trade.error.tradeNotFound',
        'You cannot respond to this trade': 'trade.error.cannotRespond',
        'The trade has already been responded': 'trade.error.alreadyResponded',
        'Only the proposer can cancel': 'trade.error.cancelNotOwner',
        'Only pending trades can be cancelled': 'trade.error.cancelNotPending',
        'You are not part of this trade': 'trade.error.notParticipant',
        'The trade must be accepted to view contact information': 'trade.error.notAccepted',
      }
      const key = ERROR_MAP[msg]
      if (key) {
        toast.error(t(key))
      } else if (msg.includes(' must be ') || msg.includes(' must not ')) {
        toast.error(t('trade.error.validation'))
      } else if (msg.startsWith('Only ')) {
        toast.error(
          msg.includes('requested product')
            ? t('trade.error.requestedQtyExceeds')
            : t('trade.error.offeredQtyExceeds'),
        )
      } else if (msg.endsWith(' is not available')) {
        toast.error(t('trade.error.offeredNotAvailable'))
      } else {
        toast.error(t('trade.error.generic'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
    </div>
  )

  if (!product) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500">Producto no encontrado</p>
      <Link href="/productos" className="text-green-600 hover:underline">Ver productos</Link>
    </div>
  )

  const owner = typeof product.owner === 'object' ? product.owner : null
  const isOwner = user && owner && owner._id === user._id

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/productos" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> {t('product.back')}
        </Link>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Images */}
          <div className="relative aspect-video bg-gray-100">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[0].url}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                priority
                className="object-cover"
                style={{ objectPosition: product.images[0].objectPosition || 'center center' }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-6xl">🌾</div>
            )}
            {product.isOrganic && (
              <span className="absolute top-3 left-3 bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                <Leaf className="h-3 w-3" /> {t('product.organic')}
              </span>
            )}
          </div>

          {/* Thumbnail strip */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto">
              {product.images.map((img, i) => (
                <div key={i} className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden">
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                    style={{ objectPosition: img.objectPosition || 'center center' }}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                  {CATEGORY_LABELS[product.category as keyof typeof CATEGORY_LABELS] || product.category}
                </span>
                <h1 className="text-2xl font-bold text-gray-900 mt-2">{product.title}</h1>
                <div className="text-gray-500 text-sm mt-1 space-y-0.5">
                  {(product as Product & { locations?: ProductLocation[] }).locations?.map((loc, i) => (
                    <p key={i} className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {loc.name} &mdash; {loc.municipality}, {loc.province}
                    </p>
                  ))}
                  {(product as Product & { location?: ProductLocation }).location && !(product as Product & { locations?: ProductLocation[] }).locations && (
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {(product as Product & { location?: ProductLocation }).location!.name}, {(product as Product & { location?: ProductLocation }).location!.province}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-600">{product.quantity} {product.unit}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-1">
                  <Eye className="h-3 w-3" /> {product.views} {t('product.views')}
                </p>
              </div>
            </div>

            <p className="text-gray-700 mt-4 leading-relaxed">{product.description}</p>

            {product.lookingFor && product.lookingFor.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700">{t('product.lookingFor')}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {product.lookingFor.map((item, i) => (
                    <span key={i} className="bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded-full">{item}</span>
                  ))}
                </div>
              </div>
            )}

            {product.harvestDate && (
              <p className="text-sm text-gray-500 mt-3">
                {t('product.harvestDate')} <span className="font-medium">{new Date(product.harvestDate).toLocaleDateString('es-ES')}</span>
              </p>
            )}

            {/* Owner info */}
            {owner && (
              <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                  {owner.firstName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{owner.firstName} {owner.lastName}</p>
                  <p className="text-xs text-gray-500">{t('product.farmer')}</p>
                </div>
              </div>
            )}

            {/* CTA */}
            {!isOwner && product.status === 'available' && getAvailableQty(product) > 0 && (
              <button
                onClick={openTradeModal}
                className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {t('product.proposeTrade')}
              </button>
            )}
            {!isOwner && product.status === 'available' && getAvailableQty(product) <= 0 && (
              <p className="mt-6 text-center text-gray-400 text-sm">Producto sin disponibilidad</p>
            )}
            {isOwner && (
              <Link
                href={`/dashboard/products/${product._id}/edit`}
                className="mt-6 block text-center w-full border border-green-600 text-green-600 hover:bg-green-50 font-semibold py-3 rounded-xl transition-colors"
              >
                {t('product.edit')}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Trade Modal */}
      {showTradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t('product.trade.title')}</h2>
              <button onClick={() => setShowTradeModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{t('product.trade.subtitle')} <strong>{product.title}</strong></p>

            {/* Requested quantity */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1">
                {t('product.trade.requestedQuantity')} {product.title} ({product.unit})
              </label>
              <input
                type="number"
                min={1}
                max={getAvailableQty(product)}
                value={requestedQty}
                onChange={(e) => setRequestedQty(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                {t('product.trade.available', { quantity: getAvailableQty(product), unit: product.unit })}
              </p>
            </div>

            {/* Text-only toggle */}
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={textOnly}
                onChange={() => {
                  setTextOnly(!textOnly)
                  if (!textOnly) setSelectedProduct('')
                }}
                className="accent-green-600"
              />
              <span className="text-sm text-gray-600">{t('product.trade.onlyMessage')}</span>
            </label>

            {!textOnly && (
              <>
                {/* Product selection */}
                {myProducts.length > 0 ? (
                  <>
                    <p className="text-sm font-medium text-gray-700 mb-2">{t('product.trade.yourProducts')}</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
                      {myProducts.map((p) => {
                        const avail = getAvailableQty(p)
                        return (
                          <label key={p._id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedProduct === p._id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <input
                              type="radio"
                              name="offeredProduct"
                              value={p._id}
                              checked={selectedProduct === p._id}
                              onChange={() => handleProductSelect(p._id)}
                              className="accent-green-600"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{p.title}</p>
                              <p className="text-xs text-gray-500">{t('product.trade.available', { quantity: avail, unit: p.unit })}</p>
                            </div>
                          </label>
                        )
                      })}
                    </div>

                    {/* Offered quantity */}
                    {selectedProduct && (
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          {t('product.trade.offeredQuantity')}
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={(() => {
                            const p = myProducts.find((x) => x._id === selectedProduct)
                            return p ? getAvailableQty(p) : 0
                          })()}
                          value={offeredQty}
                          onChange={(e) => setOfferedQty(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
                        />
                      </div>
                    )}

                    {/* Quick actions */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={handleAddProduct}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                      >
                        <Plus className="h-3 w-3" /> {t('product.trade.publishLink')}
                      </button>
                      {selectedProduct && (
                        <Link
                          href={`/dashboard/products/${selectedProduct}/edit`}
                          className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700"
                        >
                          <PenLine className="h-3 w-3" /> {t('product.trade.modifyStock')} {myProducts.find((p) => p._id === selectedProduct)?.title}
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 mb-4">
                    <p className="text-gray-500 text-sm mb-3">{t('product.trade.noAvailable')}</p>
                    <div className="flex flex-col gap-2 items-center">
                      <button
                        onClick={handleAddProduct}
                        className="text-green-600 text-sm hover:underline flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> {t('product.trade.publishLink')}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Message */}
            <textarea
              placeholder={textOnly ? t('product.trade.messageRequired') : t('product.trade.messagePlaceholder')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none h-20 outline-none focus:border-green-500 mb-4"
            />

            <button
              onClick={submitTrade}
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {submitting ? t('product.trade.submitting') : t('product.trade.submit')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
