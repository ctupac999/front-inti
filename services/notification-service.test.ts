import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGet = vi.fn()
const mockPatch = vi.fn()
vi.mock('@/utils/api', () => ({
  get: mockGet,
  patch: mockPatch,
}))

const { getNotifications, getUnreadCount, markAsRead, markAllAsRead } =
  await import('./notification-service')

beforeEach(() => {
  mockGet.mockReset()
  mockPatch.mockReset()
})

const mockNotification = {
  _id: 'n1',
  user: 'u1',
  type: 'trade_proposed' as const,
  referenceId: 't1',
  title: 'Juan te ha enviado una propuesta de trueque',
  message: 'Intercambio?',
  read: false,
  createdAt: '2024-01-01T00:00:00Z',
}

describe('getNotifications', () => {
  it('calls GET /notifications with default params', async () => {
    const response = {
      notifications: [mockNotification],
      total: 1,
      unreadTotal: 1,
      page: 1,
      limit: 20,
    }
    mockGet.mockResolvedValue(response)
    const result = await getNotifications()
    expect(mockGet).toHaveBeenCalledWith('/notifications?page=1&limit=20')
    expect(result.notifications).toHaveLength(1)
    expect(result.unreadTotal).toBe(1)
  })

  it('passes filter param when unread', async () => {
    mockGet.mockResolvedValue({
      notifications: [],
      total: 0,
      unreadTotal: 0,
      page: 1,
      limit: 20,
    })
    await getNotifications(1, 20, 'unread')
    expect(mockGet).toHaveBeenCalledWith('/notifications?page=1&limit=20&filter=unread')
  })

  it('does not pass filter param for all', async () => {
    mockGet.mockResolvedValue({
      notifications: [],
      total: 0,
      unreadTotal: 0,
      page: 1,
      limit: 20,
    })
    await getNotifications(1, 20, 'all')
    expect(mockGet).toHaveBeenCalledWith('/notifications?page=1&limit=20')
  })
})

describe('getUnreadCount', () => {
  it('calls GET /notifications/unread-count', async () => {
    mockGet.mockResolvedValue({ count: 3 })
    const result = await getUnreadCount()
    expect(mockGet).toHaveBeenCalledWith('/notifications/unread-count')
    expect(result.count).toBe(3)
  })
})

describe('markAsRead', () => {
  it('calls PATCH /notifications/:id/read', async () => {
    mockPatch.mockResolvedValue({ ...mockNotification, read: true })
    const result = await markAsRead('n1')
    expect(mockPatch).toHaveBeenCalledWith('/notifications/n1/read', {})
    expect(result.read).toBe(true)
  })
})

describe('markAllAsRead', () => {
  it('calls PATCH /notifications/read-all', async () => {
    mockPatch.mockResolvedValue({ acknowledged: true })
    const result = await markAllAsRead()
    expect(mockPatch).toHaveBeenCalledWith('/notifications/read-all', {})
    expect(result.acknowledged).toBe(true)
  })
})
