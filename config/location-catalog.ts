import { City, Country, State } from 'country-state-city'

export type CountryCode = string

export interface CountryOption {
  code: CountryCode
  name: string
}

export interface CountryLocationConfig {
  code: CountryCode
  name: string
  regionLabel: string
  municipalityLabel: string
  postalCodeLabel: string
  regions: Record<string, string[]>
}

export interface PostalCodeEntry {
  code: string
  locality?: string
}

type CountryLabelConfig = Pick<
  CountryLocationConfig,
  'regionLabel' | 'municipalityLabel' | 'postalCodeLabel'
>

const COUNTRY_NAME_OVERRIDES: Record<string, string> = {
  AR: 'Argentina',
  BO: 'Bolivia',
  BR: 'Brasil',
  CL: 'Chile',
  CO: 'Colombia',
  CR: 'Costa Rica',
  CU: 'Cuba',
  DO: 'Republica Dominicana',
  EC: 'Ecuador',
  ES: 'Espana',
  GT: 'Guatemala',
  HN: 'Honduras',
  MX: 'Mexico',
  NI: 'Nicaragua',
  PA: 'Panama',
  PE: 'Peru',
  PY: 'Paraguay',
  SV: 'El Salvador',
  UY: 'Uruguay',
  VE: 'Venezuela',
}

const COUNTRY_LABEL_OVERRIDES: Record<string, CountryLabelConfig> = {
  AR: {
    regionLabel: 'Provincia',
    municipalityLabel: 'Partido / Municipio',
    postalCodeLabel: 'Codigo postal',
  },
  BO: {
    regionLabel: 'Departamento',
    municipalityLabel: 'Provincia / Municipio',
    postalCodeLabel: 'Codigo postal',
  },
  BR: {
    regionLabel: 'Estado',
    municipalityLabel: 'Municipio',
    postalCodeLabel: 'CEP (codigo postal)',
  },
  CL: {
    regionLabel: 'Region',
    municipalityLabel: 'Comuna / Ciudad',
    postalCodeLabel: 'Codigo postal',
  },
  CO: {
    regionLabel: 'Departamento',
    municipalityLabel: 'Municipio',
    postalCodeLabel: 'Codigo postal',
  },
  EC: {
    regionLabel: 'Provincia',
    municipalityLabel: 'Canton / Ciudad',
    postalCodeLabel: 'Codigo postal',
  },
  ES: {
    regionLabel: 'Comunidad / Provincia',
    municipalityLabel: 'Municipio',
    postalCodeLabel: 'Codigo postal',
  },
  MX: {
    regionLabel: 'Estado',
    municipalityLabel: 'Municipio / Ciudad',
    postalCodeLabel: 'Codigo postal',
  },
  PE: {
    regionLabel: 'Departamento',
    municipalityLabel: 'Provincia / Distrito',
    postalCodeLabel: 'Codigo postal',
  },
  PY: {
    regionLabel: 'Departamento',
    municipalityLabel: 'Distrito / Ciudad',
    postalCodeLabel: 'Codigo postal',
  },
  UY: {
    regionLabel: 'Departamento',
    municipalityLabel: 'Ciudad / Municipio',
    postalCodeLabel: 'Codigo postal',
  },
  VE: {
    regionLabel: 'Estado',
    municipalityLabel: 'Municipio / Ciudad',
    postalCodeLabel: 'Codigo postal',
  },
}

const DEFAULT_LABELS: CountryLabelConfig = {
  regionLabel: 'Estado / Provincia',
  municipalityLabel: 'Ciudad / Municipio',
  postalCodeLabel: 'Codigo postal',
}

const OFFICIAL_POSTAL_WEBSITES: Record<string, string> = {
  PE: 'https://codigopostal.gob.pe',
  AR: 'https://www.correoargentino.com.ar/formularios/codigo-postal',
  CL: 'https://www.correos.cl/site/codigo-postal',
  MX: 'https://www.correosdemexico.gob.mx/SSLServicios/ConsultaCP/Descarga.aspx',
  ES: 'https://www.correos.es/es/es/herramientas/codigos-postales',
  BR: 'https://buscacepinter.correios.com.br/app/endereco/index.php',
  CO: 'https://www.4-72.com.co/herramientas/codigo-postal/',
}

export const FALLBACK_ENABLED_COUNTRY_CODES = Object.keys(COUNTRY_NAME_OVERRIDES)

const ALL_COUNTRIES = Country.getAllCountries()

function normalizeCountryCodes(codes: string[]): string[] {
  return codes
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean)
}

function resolveEnabledCountryCodes(enabledCountryCodes?: string[]): string[] {
  if (enabledCountryCodes && enabledCountryCodes.length > 0) {
    return normalizeCountryCodes(enabledCountryCodes)
  }

  return getEnabledCountryCodes()
}

function getEnabledCountryCodes(): string[] {
  const raw = process.env.NEXT_PUBLIC_ENABLED_COUNTRIES
  if (!raw) return FALLBACK_ENABLED_COUNTRY_CODES

  const parsed = normalizeCountryCodes(raw.split(','))

  return parsed.length > 0 ? parsed : FALLBACK_ENABLED_COUNTRY_CODES
}

function buildCountryOptions(enabledCountryCodes?: string[]): CountryOption[] {
  const enabledSet = new Set(resolveEnabledCountryCodes(enabledCountryCodes))

  return ALL_COUNTRIES
    .filter((country) => enabledSet.has(country.isoCode))
    .map((country) => ({
      code: country.isoCode,
      name: COUNTRY_NAME_OVERRIDES[country.isoCode] ?? country.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

const countryOptions: CountryOption[] = buildCountryOptions()

export const DEFAULT_COUNTRY_CODE: CountryCode = 'PE'

function getResolvedDefaultCountryCode(options: CountryOption[]): CountryCode {
  return options.some((country) => country.code === DEFAULT_COUNTRY_CODE)
    ? DEFAULT_COUNTRY_CODE
    : (options[0]?.code ?? DEFAULT_COUNTRY_CODE)
}

export function getCountryOptions(enabledCountryCodes?: string[]): CountryOption[] {
  if (!enabledCountryCodes) return countryOptions
  return buildCountryOptions(enabledCountryCodes)
}

// Cache for region+municipality data per country to avoid O(n²) recomputation
const regionsCache = new Map<string, Record<string, string[]>>()

function buildRegionsMap(countryCode: string): Record<string, string[]> {
  const states = State.getStatesOfCountry(countryCode)
  const map: Record<string, string[]> = {}

  for (const state of states) {
    const regionName = state.name
    if (!regionName) continue

    const cities = City.getCitiesOfState(countryCode, state.isoCode)
      .map((city) => city.name)
      .filter(Boolean)

    map[regionName] = Array.from(new Set(cities)).sort((a, b) =>
      a.localeCompare(b, 'es'),
    )
  }

  return map
}

export function getCountryConfig(code: string, enabledCountryCodes?: string[]): CountryLocationConfig {
  const options = getCountryOptions(enabledCountryCodes)
  const resolvedDefaultCode = getResolvedDefaultCountryCode(options)
  const option =
    options.find((country) => country.code === code) ??
    options.find((country) => country.code === resolvedDefaultCode)
  const resolvedCode = option?.code ?? resolvedDefaultCode
  const labels = COUNTRY_LABEL_OVERRIDES[resolvedCode] ?? DEFAULT_LABELS

  if (!regionsCache.has(resolvedCode)) {
    regionsCache.set(resolvedCode, buildRegionsMap(resolvedCode))
  }
  const regions = regionsCache.get(resolvedCode)!

  return {
    code: resolvedCode,
    name: option?.name ?? 'Peru',
    regionLabel: labels.regionLabel,
    municipalityLabel: labels.municipalityLabel,
    postalCodeLabel: labels.postalCodeLabel,
    regions,
  }
}

// Backward compatibility for stale HMR chunks that still import LOCATION_CATALOG
export const LOCATION_CATALOG = getCountryOptions().map((country) => {
  const config = getCountryConfig(country.code)
  return {
    code: config.code,
    name: config.name,
    regionLabel: config.regionLabel,
    municipalityLabel: config.municipalityLabel,
    regions: config.regions,
  }
})

export function isCountryCodeEnabled(
  countryCode: string,
  enabledCountryCodes?: string[],
): boolean {
  const normalizedCode = countryCode.trim().toUpperCase()
  const enabledSet = new Set(resolveEnabledCountryCodes(enabledCountryCodes))
  return enabledSet.has(normalizedCode)
}

export function getRegionOptions(countryCode: string): string[] {
  const config = getCountryConfig(countryCode)
  return Object.keys(config.regions)
}

export function getMunicipalityOptions(
  countryCode: string,
  regionName: string,
): string[] {
  if (!regionName) return []
  const config = getCountryConfig(countryCode)
  return config.regions[regionName] ?? []
}

export function getCommunityOptions(
  _countryCode: string,
  _province: string,
  _municipality: string,
): string[] {
  return []
}

// Lazy-loaded postal-code cache per country
const postalCodeCache = new Map<string, Record<string, string[]>>()

export async function getPostalCodesForMunicipality(
  countryCode: string,
  municipality: string,
): Promise<PostalCodeEntry[]> {
  if (!municipality) return []

  if (!postalCodeCache.has(countryCode)) {
    try {
      const mod = await import(
        /* webpackChunkName: "postal-codes" */ `@/config/postal-codes/${countryCode.toLowerCase()}.json`
      )
      postalCodeCache.set(countryCode, mod.default as Record<string, string[]>)
    } catch {
      postalCodeCache.set(countryCode, {})
    }
  }

  const data = postalCodeCache.get(countryCode)!
  const normalizedMunicipality = municipality.toLowerCase().trim()
  const match = Object.entries(data).find(
    ([key]) => key.toLowerCase().trim() === normalizedMunicipality,
  )
  if (match) {
    return match[1].map((code) => ({ code }))
  }

  return Object.entries(data).flatMap(([key, codes]) =>
    key.toLowerCase().trim().includes(normalizedMunicipality)
      ? codes.map((code) => ({ code, locality: key }))
      : [],
  )
}

export function getOfficialPostalWebsite(countryCode: string): string | null {
  return OFFICIAL_POSTAL_WEBSITES[countryCode] ?? null
}
