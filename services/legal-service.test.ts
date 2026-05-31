import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGet = vi.fn()
vi.mock('@/utils/api', () => ({
  get: mockGet,
}))

const { getLegalVersion } = await import('./legal-service')

beforeEach(() => {
  mockGet.mockReset()
})

describe('getLegalVersion', () => {
  it('calls GET /legal/version and returns data', async () => {
    const response = {
      legalVersion: 'v2.0',
      termsUrl: '/legal/terms',
      privacyUrl: '/legal/privacy',
      consentUrl: '/legal/consent',
      updatedAt: '2024-06-01T00:00:00Z',
    }
    mockGet.mockResolvedValue(response)
    const result = await getLegalVersion()
    expect(mockGet).toHaveBeenCalledWith('/legal/version')
    expect(result.legalVersion).toBe('v2.0')
    expect(result.termsUrl).toBe('/legal/terms')
  })
})
