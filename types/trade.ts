import type { Product } from './product'
import type { User } from './user'

export type TradeStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'

export interface Trade {
  _id: string
  proposer: User
  offeredProduct: Product
  receiver: User
  requestedProduct: Product
  status: TradeStatus
  message?: string
  responseMessage?: string
  completedAt?: string
  createdAt: string
}

export const TRADE_STATUS_LABELS: Record<TradeStatus, string> = {
  pending: '⏳ Pendiente',
  accepted: '✅ Aceptado',
  rejected: '❌ Rechazado',
  completed: '🤝 Completado',
  cancelled: '🚫 Cancelado',
}
