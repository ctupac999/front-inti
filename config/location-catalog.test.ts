import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getCountryOptions,
  getCountryConfig,
  getRegionOptions,
  getMunicipalityOptions,
  getCommunityOptions,
  getPostalCodesForMunicipality,
  getOfficialPostalWebsite,
  DEFAULT_COUNTRY_CODE,
  FALLBACK_ENABLED_COUNTRY_CODES,
  isCountryCodeEnabled,
} from './location-catalog'

vi.mock('country-state-city', () => {
  const mockStates: Array<{ name: string; isoCode: string; countryCode: string }> = [
    { name: 'Buenos Aires', isoCode: 'AR-B', countryCode: 'AR' },
    { name: 'Córdoba', isoCode: 'AR-C', countryCode: 'AR' },
    { name: 'Lima', isoCode: 'PE-L', countryCode: 'PE' },
    { name: 'Cusco', isoCode: 'PE-C', countryCode: 'PE' },
  ]

  const mockCities: Array<{ name: string; countryCode: string; stateCode: string }> = [
    { name: 'La Plata', countryCode: 'AR', stateCode: 'AR-B' },
    { name: 'Mar del Plata', countryCode: 'AR', stateCode: 'AR-B' },
    { name: 'Córdoba Capital', countryCode: 'AR', stateCode: 'AR-C' },
    { name: 'Villa María', countryCode: 'AR', stateCode: 'AR-C' },
    { name: 'Lima Centro', countryCode: 'PE', stateCode: 'PE-L' },
    { name: 'Miraflores', countryCode: 'PE', stateCode: 'PE-L' },
    { name: 'Cusco Centro', countryCode: 'PE', stateCode: 'PE-C' },
    { name: 'Urubamba', countryCode: 'PE', stateCode: 'PE-C' },
  ]

  return {
    Country: {
      getAllCountries: () => [
        { isoCode: 'AR', name: 'Argentina', phonecode: '54' },
        { isoCode: 'PE', name: 'Peru', phonecode: '51' },
        { isoCode: 'ES', name: 'Spain', phonecode: '34' },
      ],
    },
    State: {
      getStatesOfCountry: (code: string) =>
        mockStates.filter((s) => s.countryCode === code),
    },
    City: {
      getCitiesOfState: (countryCode: string, stateCode: string) =>
        mockCities.filter((c) => c.countryCode === countryCode && c.stateCode === stateCode),
    },
  }
})

beforeEach(() => {
  vi.stubGlobal('process', {
    ...process,
    env: {
      ...process.env,
      NEXT_PUBLIC_ENABLED_COUNTRIES: 'AR,PE',
    },
  })
})

describe('getCountryOptions', () => {
  it('returns sorted enabled countries', () => {
    const options = getCountryOptions(['AR', 'PE'])
    expect(options).toHaveLength(2)
    expect(options[0].code).toBe('AR')
    expect(options[0].name).toBe('Argentina')
    expect(options[1].code).toBe('PE')
    expect(options[1].name).toBe('Peru')
  })

  it('filters by enabled country codes param', () => {
    const options = getCountryOptions(['PE'])
    expect(options).toHaveLength(1)
    expect(options[0].code).toBe('PE')
  })

  it('returns empty when no countries match', () => {
    const options = getCountryOptions(['XX'])
    expect(options).toHaveLength(0)
  })
})

describe('getCountryConfig', () => {
  it('returns config for a valid country', () => {
    const config = getCountryConfig('AR')
    expect(config.code).toBe('AR')
    expect(config.name).toBe('Argentina')
    expect(config.regionLabel).toBe('Provincia')
    expect(config.municipalityLabel).toBe('Partido / Municipio')
    expect(config.postalCodeLabel).toBe('Codigo postal')
  })

  it('returns PE config for Peru', () => {
    const config = getCountryConfig('PE')
    expect(config.regionLabel).toBe('Departamento')
    expect(config.municipalityLabel).toBe('Provincia / Distrito')
    expect(config.regions).toHaveProperty('Lima')
    expect(config.regions).toHaveProperty('Cusco')
  })

  it('falls back to default country when code is invalid', () => {
    const config = getCountryConfig('XX')
    expect(config.code).toBe(DEFAULT_COUNTRY_CODE)
  })

  it('is cached (same regions reference on second call)', () => {
    const config1 = getCountryConfig('AR')
    const config2 = getCountryConfig('AR')
    expect(config1.regions).toBe(config2.regions)
  })

  it('has correct municipalities per region', () => {
    const config = getCountryConfig('AR')
    expect(config.regions['Buenos Aires']).toEqual([
      'La Plata',
      'Mar del Plata',
    ])
    expect(config.regions['Córdoba']).toEqual([
      'Córdoba Capital',
      'Villa María',
    ])
  })
})

describe('getRegionOptions', () => {
  it('returns sorted region names', () => {
    const regions = getRegionOptions('AR')
    expect(regions).toEqual(['Buenos Aires', 'Córdoba'])
  })

  it('falls back to default country regions for unknown country', () => {
    const regions = getRegionOptions('XX')
    expect(regions).toEqual(['Lima', 'Cusco'])
  })
})

describe('getMunicipalityOptions', () => {
  it('returns municipalities for a valid region', () => {
    const options = getMunicipalityOptions('AR', 'Buenos Aires')
    expect(options).toEqual(['La Plata', 'Mar del Plata'])
  })

  it('returns empty for unknown region', () => {
    const options = getMunicipalityOptions('AR', 'Nowhere')
    expect(options).toEqual([])
  })

  it('returns empty when region name is empty', () => {
    const options = getMunicipalityOptions('AR', '')
    expect(options).toEqual([])
  })
})

describe('getCommunityOptions', () => {
  it('returns empty array initially', () => {
    const options = getCommunityOptions('PE', 'Lima', 'Lima Centro')
    expect(options).toEqual([])
  })
})

describe('isCountryCodeEnabled', () => {
  it('returns true for enabled country', () => {
    expect(isCountryCodeEnabled('AR')).toBe(true)
    expect(isCountryCodeEnabled('PE')).toBe(true)
  })

  it('returns false for disabled country', () => {
    expect(isCountryCodeEnabled('ES')).toBe(false)
  })

  it('is case insensitive', () => {
    expect(isCountryCodeEnabled('ar')).toBe(true)
    expect(isCountryCodeEnabled('pe')).toBe(true)
  })
})

describe('getOfficialPostalWebsite', () => {
  it('returns URL for known countries', () => {
    expect(getOfficialPostalWebsite('PE')).toBe('https://codigopostal.gob.pe')
    expect(getOfficialPostalWebsite('AR')).toContain('correoargentino')
  })

  it('returns null for unknown countries', () => {
    expect(getOfficialPostalWebsite('XX')).toBeNull()
  })
})

describe('getPostalCodesForMunicipality', () => {
  it('returns empty when municipality is empty', async () => {
    const result = await getPostalCodesForMunicipality('PE', '')
    expect(result).toEqual([])
  })

  it('returns empty when postal data not found', async () => {
    const result = await getPostalCodesForMunicipality('XX', 'Somewhere')
    expect(result).toEqual([])
  })
})

describe('DEFAULT_COUNTRY_CODE', () => {
  it('is PE', () => {
    expect(DEFAULT_COUNTRY_CODE).toBe('PE')
  })
})

describe('FALLBACK_ENABLED_COUNTRY_CODES', () => {
  it('contains AR and PE', () => {
    expect(FALLBACK_ENABLED_COUNTRY_CODES).toContain('AR')
    expect(FALLBACK_ENABLED_COUNTRY_CODES).toContain('PE')
  })
})
