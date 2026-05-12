import { get, post, patch } from '@/utils/api'
import { API_ROUTES } from '@/utils/api-config'
import type { Trade } from '@/types/trade'

export async function getMyTrades(): Promise<Trade[]> {
  return get<Trade[]>(API_ROUTES.myTrades)
}

export async function proposeTrade(data: {
  offeredProduct: string
  requestedProduct: string
  message?: string
}): Promise<Trade> {
  return post<Trade>(API_ROUTES.trades, data)
}

export async function respondTrade(
  id: string,
  status: 'accepted' | 'rejected',
  responseMessage?: string,
): Promise<Trade> {
  return patch<Trade>(`${API_ROUTES.trades}/${id}/respond`, { status, responseMessage })
}

export async function cancelTrade(id: string): Promise<Trade> {
  return patch<Trade>(`${API_ROUTES.trades}/${id}/cancel`, {})
}

export async function getAllTradesAdmin(page = 1, limit = 50): Promise<{ trades: Trade[]; total: number }> {
  return get<{ trades: Trade[]; total: number }>(`${API_ROUTES.adminTrades || '/admin/trades'}?page=${page}&limit=${limit}`)
}
