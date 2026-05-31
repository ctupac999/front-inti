'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { getMyTrades, respondTrade, cancelTrade } from '@/services/trade-service'
import { Trade, TRADE_STATUS_LABELS } from '@/types/trade'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react'

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
  completed: 'bg-blue-100 text-blue-700',
}

export default function TradesPage() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [fetching, setFetching] = useState(true)
  const [tab, setTab] = useState<'received' | 'sent'>('received')

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      getMyTrades()
        .then(setTrades)
        .catch(() => toast.error(t('trades.loadError')))
        .finally(() => setFetching(false))
    }
  }, [user, t])

  const received = trades.filter(t => {
    const receiver = typeof t.receiver === 'object' ? t.receiver : null
    return receiver && receiver._id === user?._id
  })
  const sent = trades.filter(t => {
    const proposer = typeof t.proposer === 'object' ? t.proposer : null
    return proposer && proposer._id === user?._id
  })

  const shown = tab === 'received' ? received : sent

  const handleRespond = async (tradeId: string, status: 'accepted' | 'rejected') => {
    try {
      await respondTrade(tradeId, status)
      setTrades(prev => prev.map(t => t._id === tradeId ? { ...t, status } : t))
      toast.success(status === 'accepted' ? t('trades.accepted') : t('trades.rejected'))
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : 'Error')
    }
  }

  const handleCancel = async (tradeId: string) => {
    try {
      await cancelTrade(tradeId)
      setTrades(prev => prev.map(t => t._id === tradeId ? { ...t, status: 'cancelled' } : t))
      toast.success(t('trades.cancelled'))
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : 'Error')
    }
  }

  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> {t('common.backToPanel')}
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('trades.title')}</h1>

        <div className="flex gap-2 mb-6">
          {(['received', 'sent'] as const).map(tabKey => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tabKey ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
            >
              {tabKey === 'received' ? `${t('trades.received')} (${received.length})` : `${t('trades.sent')} (${sent.length})`}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-gray-500 shadow-sm">
            <p className="text-4xl mb-3">🤝</p>
            <p>{tab === 'received' ? t('trades.noReceived') : t('trades.noSent')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shown.map(trade => {
              const offered = typeof trade.offeredProduct === 'object' ? trade.offeredProduct : null
              const requested = typeof trade.requestedProduct === 'object' ? trade.requestedProduct : null
              const proposer = typeof trade.proposer === 'object' ? trade.proposer : null
              return (
                <div key={trade._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[trade.status] || 'bg-gray-100 text-gray-600'}`}>
                          {TRADE_STATUS_LABELS[trade.status as keyof typeof TRADE_STATUS_LABELS] || trade.status}
                        </span>
                        <span className="text-xs text-gray-400">{new Date(trade.createdAt || '').toLocaleDateString('es-ES')}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <span className="font-medium">{offered?.title || 'Producto'}</span>
                        <span className="text-gray-400">⇄</span>
                        <span className="font-medium">{requested?.title || 'Producto'}</span>
                      </div>
                      {tab === 'received' && proposer && (
                        <p className="text-xs text-gray-500 mt-1">{t('trades.from')}: {proposer.firstName} {proposer.lastName}</p>
                      )}
                      {trade.message && (
                        <p className="text-xs text-gray-500 mt-2 italic">&quot;{trade.message}&quot;</p>
                      )}
                    </div>

                    {trade.status === 'pending' && tab === 'received' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleRespond(trade._id, 'accepted')} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                          <CheckCircle className="h-3.5 w-3.5" /> {t('trades.accept')}
                        </button>
                        <button onClick={() => handleRespond(trade._id, 'rejected')} className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs px-3 py-1.5 rounded-lg transition-colors">
                          <XCircle className="h-3.5 w-3.5" /> {t('trades.reject')}
                        </button>
                      </div>
                    )}
                    {trade.status === 'pending' && tab === 'sent' && (
                      <button onClick={() => handleCancel(trade._id)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                        <Clock className="h-3.5 w-3.5" /> {t('trades.cancel')}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
