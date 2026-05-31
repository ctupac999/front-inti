import { describe, it, expect } from 'vitest'
import { useSiteConfigStore } from './site-config-store'
import type { SiteConfig } from '@/types/site-config'

const baseConfig: SiteConfig = {
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

describe('site-config-store', () => {
  it('starts with null config', () => {
    const { config } = useSiteConfigStore.getState()
    expect(config).toBeNull()
  })

  it('setConfig updates the config', () => {
    useSiteConfigStore.getState().setConfig(baseConfig)
    const { config } = useSiteConfigStore.getState()
    expect(config).toEqual(baseConfig)
  })

  it('overwrites previous config', () => {
    useSiteConfigStore.getState().setConfig({ ...baseConfig, siteName: 'Old' })
    useSiteConfigStore.getState().setConfig({ ...baseConfig, siteName: 'Nuevo Nombre' })
    const { config } = useSiteConfigStore.getState()
    expect(config?.siteName).toBe('Nuevo Nombre')
  })
})
