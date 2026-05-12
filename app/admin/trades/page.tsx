'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { getAllTradesAdmin } from '@/services/trade-service'
import { Trade, TRADE_STATUS_LABELS } from '@/types/trade'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
  completed: 'bg-blue-100 text-blue-700',
}

export default function AdminTradesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/auth/login')
      else if (user.role !== 'admin') router.push('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      getAllTradesAdmin()
        .then(res => setTrades(res.trades))
        .catch(() => toast.error('Error al cargar trueques'))
        .finally(() => setFetching(false))
    }
  }, [user])

  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> Volver al admin
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Trueques ({trades.length})</h1>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Propone</th>
                  <th className="text-left px-5 py-3">Ofrece</th>
                  <th className="text-left px-5 py-3">Solicita</th>
                  <th className="text-left px-5 py-3">Recibe</th>
                  <th className="text-left px-5 py-3">Estado</th>
                  <th className="text-left px-5 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trades.map(t => {
                  const proposer = typeof t.proposer === 'object' ? t.proposer : null
                  const receiver = typeof t.receiver === 'object' ? t.receiver : null
                  const offered = typeof t.offeredProduct === 'object' ? t.offeredProduct : null
                  const requested = typeof t.requestedProduct === 'object' ? t.requestedProduct : null
                  return (
                    <tr key={t._id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-700">{proposer?.firstName} {proposer?.lastName}</td>
                      <td className="px-5 py-3 text-gray-500 max-w-[160px] truncate">{offered?.title || '—'}</td>
                      <td className="px-5 py-3 text-gray-500 max-w-[160px] truncate">{requested?.title || '—'}</td>
                      <td className="px-5 py-3 text-gray-700">{receiver?.firstName} {receiver?.lastName}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[t.status] || 'bg-gray-100 text-gray-600'}`}>
                          {TRADE_STATUS_LABELS[t.status as keyof typeof TRADE_STATUS_LABELS] || t.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400">{new Date(t.createdAt || '').toLocaleDateString('es-ES')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
