import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGet = vi.fn()
const mockPatch = vi.fn()
const mockPostForm = vi.fn()
vi.mock('@/utils/api', () => ({
  get: mockGet,
  patch: mockPatch,
  postForm: mockPostForm,
}))

const { getSiteConfig, updateSiteConfig, uploadLogo } = await import('./site-config-service')

beforeEach(() => {
  mockGet.mockReset()
  mockPatch.mockReset()
  mockPostForm.mockReset()
})

const mockConfig = {
  siteName: 'INTI',
  siteSlogan: 'Trueque sostenible',
  contactEmail: 'info@inti.com',
  contactPhone: '+5412345678',
  logo: { url: 'https://img.com/logo.png', publicId: 'logo/123' },
  primaryColor: '#16a34a',
  secondaryColor: '#15803d',
  facebookUrl: '',
  instagramUrl: '',
  whatsappNumber: '',
  aboutText: '',
  allowRegistrations: true,
  enabledCountries: ['AR'],
  legalVersion: 'v1.0',
}

describe('getSiteConfig', () => {
  it('calls GET /site-config', async () => {
    mockGet.mockResolvedValue(mockConfig)
    const result = await getSiteConfig()
    expect(mockGet).toHaveBeenCalledWith('/site-config')
    expect(result.siteName).toBe('INTI')
  })
})

describe('updateSiteConfig', () => {
  it('calls PATCH /site-config with partial data', async () => {
    mockPatch.mockResolvedValue({ ...mockConfig, siteName: 'Nuevo Nombre' })
    const result = await updateSiteConfig({ siteName: 'Nuevo Nombre' })
    expect(mockPatch).toHaveBeenCalledWith('/site-config', { siteName: 'Nuevo Nombre' })
    expect(result.siteName).toBe('Nuevo Nombre')
  })
})

describe('uploadLogo', () => {
  it('sends FormData to POST /site-config/logo', async () => {
    mockPostForm.mockResolvedValue({ ...mockConfig, logo: { url: 'https://img.com/new-logo.png', publicId: 'logo/456' } })
    const file = new File([''], 'logo.png', { type: 'image/png' })
    const result = await uploadLogo(file)
    expect(mockPostForm).toHaveBeenCalledWith('/site-config/logo', expect.any(FormData))
    expect(result.logo.url).toBe('https://img.com/new-logo.png')
  })
})
