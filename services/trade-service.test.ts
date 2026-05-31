import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPatch = vi.fn()
vi.mock('@/utils/api', () => ({
  get: mockGet,
  post: mockPost,
  patch: mockPatch,
}))

const { getMyTrades, proposeTrade, respondTrade, cancelTrade } = await import('./trade-service')

beforeEach(() => {
  mockGet.mockReset()
  mockPost.mockReset()
  mockPatch.mockReset()
})

const mockTrade = {
  _id: 't1',
  proposer: { _id: 'u1', firstName: 'Juan', lastName: 'Pérez', email: 'j@t.com', role: 'user', locations: [], isActive: true, createdAt: '' },
  offeredProduct: { _id: 'p1', title: 'Manzanas' },
  receiver: { _id: 'u2', firstName: 'Ana', lastName: 'López', email: 'a@t.com', role: 'user', locations: [], isActive: true, createdAt: '' },
  requestedProduct: { _id: 'p2', title: 'Peras' },
  status: 'pending' as const,
  createdAt: '2024-01-01T00:00:00Z',
}

describe('getMyTrades', () => {
  it('calls GET /trades/mine', async () => {
    mockGet.mockResolvedValue([mockTrade])
    const result = await getMyTrades()
    expect(mockGet).toHaveBeenCalledWith('/trades/mine')
    expect(result).toHaveLength(1)
  })
})

describe('proposeTrade', () => {
  it('calls POST /trades with product IDs', async () => {
    mockPost.mockResolvedValue(mockTrade)
    const data = { offeredProduct: 'p1', requestedProduct: 'p2', message: 'intercambio?' }
    const result = await proposeTrade(data)
    expect(mockPost).toHaveBeenCalledWith('/trades', data)
    expect(result._id).toBe('t1')
  })

  it('works without message', async () => {
    mockPost.mockResolvedValue(mockTrade)
    await proposeTrade({ offeredProduct: 'p1', requestedProduct: 'p2' })
    expect(mockPost).toHaveBeenCalledWith('/trades', { offeredProduct: 'p1', requestedProduct: 'p2' })
  })
})

describe('respondTrade', () => {
  it('calls PATCH /trades/:id/respond with status', async () => {
    mockPatch.mockResolvedValue({ ...mockTrade, status: 'accepted' })
    const result = await respondTrade('t1', 'accepted', 'Gracias!')
    expect(mockPatch).toHaveBeenCalledWith('/trades/t1/respond', { status: 'accepted', responseMessage: 'Gracias!' })
    expect(result.status).toBe('accepted')
  })
})

describe('cancelTrade', () => {
  it('calls PATCH /trades/:id/cancel', async () => {
    mockPatch.mockResolvedValue({ ...mockTrade, status: 'cancelled' })
    const result = await cancelTrade('t1')
    expect(mockPatch).toHaveBeenCalledWith('/trades/t1/cancel', {})
    expect(result.status).toBe('cancelled')
  })
})
