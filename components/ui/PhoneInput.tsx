'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

export interface Country {
  code: string      // ISO 2-letter
  dialCode: string  // e.g. "+54"
  flag: string      // emoji
}

// Static data: only codes, dial codes and flags — names are resolved via Intl.DisplayNames
export const COUNTRY_DATA: Country[] = [
  { code: 'AF', dialCode: '+93', flag: '🇦🇫' },
  { code: 'AL', dialCode: '+355', flag: '🇦🇱' },
  { code: 'DZ', dialCode: '+213', flag: '🇩🇿' },
  { code: 'AD', dialCode: '+376', flag: '🇦🇩' },
  { code: 'AO', dialCode: '+244', flag: '🇦🇴' },
  { code: 'AG', dialCode: '+1-268', flag: '🇦🇬' },
  { code: 'AR', dialCode: '+54', flag: '🇦🇷' },
  { code: 'AM', dialCode: '+374', flag: '🇦🇲' },
  { code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { code: 'AT', dialCode: '+43', flag: '🇦🇹' },
  { code: 'AZ', dialCode: '+994', flag: '🇦🇿' },
  { code: 'BS', dialCode: '+1-242', flag: '🇧🇸' },
  { code: 'BH', dialCode: '+973', flag: '🇧🇭' },
  { code: 'BD', dialCode: '+880', flag: '🇧🇩' },
  { code: 'BB', dialCode: '+1-246', flag: '🇧🇧' },
  { code: 'BY', dialCode: '+375', flag: '🇧🇾' },
  { code: 'BE', dialCode: '+32', flag: '🇧🇪' },
  { code: 'BZ', dialCode: '+501', flag: '🇧🇿' },
  { code: 'BJ', dialCode: '+229', flag: '🇧🇯' },
  { code: 'BT', dialCode: '+975', flag: '🇧🇹' },
  { code: 'BO', dialCode: '+591', flag: '🇧🇴' },
  { code: 'BA', dialCode: '+387', flag: '🇧🇦' },
  { code: 'BW', dialCode: '+267', flag: '🇧🇼' },
  { code: 'BR', dialCode: '+55', flag: '🇧🇷' },
  { code: 'BN', dialCode: '+673', flag: '🇧🇳' },
  { code: 'BG', dialCode: '+359', flag: '🇧🇬' },
  { code: 'BF', dialCode: '+226', flag: '🇧🇫' },
  { code: 'BI', dialCode: '+257', flag: '🇧🇮' },
  { code: 'CV', dialCode: '+238', flag: '🇨🇻' },
  { code: 'KH', dialCode: '+855', flag: '🇰🇭' },
  { code: 'CM', dialCode: '+237', flag: '🇨🇲' },
  { code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { code: 'CF', dialCode: '+236', flag: '🇨🇫' },
  { code: 'TD', dialCode: '+235', flag: '🇹🇩' },
  { code: 'CL', dialCode: '+56', flag: '🇨🇱' },
  { code: 'CN', dialCode: '+86', flag: '🇨🇳' },
  { code: 'CO', dialCode: '+57', flag: '🇨🇴' },
  { code: 'KM', dialCode: '+269', flag: '🇰🇲' },
  { code: 'CG', dialCode: '+242', flag: '🇨🇬' },
  { code: 'CD', dialCode: '+243', flag: '🇨🇩' },
  { code: 'CR', dialCode: '+506', flag: '🇨🇷' },
  { code: 'HR', dialCode: '+385', flag: '🇭🇷' },
  { code: 'CU', dialCode: '+53', flag: '🇨🇺' },
  { code: 'CY', dialCode: '+357', flag: '🇨🇾' },
  { code: 'CZ', dialCode: '+420', flag: '🇨🇿' },
  { code: 'DK', dialCode: '+45', flag: '🇩🇰' },
  { code: 'DJ', dialCode: '+253', flag: '🇩🇯' },
  { code: 'DM', dialCode: '+1-767', flag: '🇩🇲' },
  { code: 'DO', dialCode: '+1-809', flag: '🇩🇴' },
  { code: 'EC', dialCode: '+593', flag: '🇪🇨' },
  { code: 'EG', dialCode: '+20', flag: '🇪🇬' },
  { code: 'SV', dialCode: '+503', flag: '🇸🇻' },
  { code: 'GQ', dialCode: '+240', flag: '🇬🇶' },
  { code: 'ER', dialCode: '+291', flag: '🇪🇷' },
  { code: 'EE', dialCode: '+372', flag: '🇪🇪' },
  { code: 'SZ', dialCode: '+268', flag: '🇸🇿' },
  { code: 'ET', dialCode: '+251', flag: '🇪🇹' },
  { code: 'FJ', dialCode: '+679', flag: '🇫🇯' },
  { code: 'FI', dialCode: '+358', flag: '🇫🇮' },
  { code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { code: 'GA', dialCode: '+241', flag: '🇬🇦' },
  { code: 'GM', dialCode: '+220', flag: '🇬🇲' },
  { code: 'GE', dialCode: '+995', flag: '🇬🇪' },
  { code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { code: 'GH', dialCode: '+233', flag: '🇬🇭' },
  { code: 'GR', dialCode: '+30', flag: '🇬🇷' },
  { code: 'GD', dialCode: '+1-473', flag: '🇬🇩' },
  { code: 'GT', dialCode: '+502', flag: '🇬🇹' },
  { code: 'GN', dialCode: '+224', flag: '🇬🇳' },
  { code: 'GW', dialCode: '+245', flag: '🇬🇼' },
  { code: 'GY', dialCode: '+592', flag: '🇬🇾' },
  { code: 'HT', dialCode: '+509', flag: '🇭🇹' },
  { code: 'HN', dialCode: '+504', flag: '🇭🇳' },
  { code: 'HU', dialCode: '+36', flag: '🇭🇺' },
  { code: 'IS', dialCode: '+354', flag: '🇮🇸' },
  { code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { code: 'ID', dialCode: '+62', flag: '🇮🇩' },
  { code: 'IR', dialCode: '+98', flag: '🇮🇷' },
  { code: 'IQ', dialCode: '+964', flag: '🇮🇶' },
  { code: 'IE', dialCode: '+353', flag: '🇮🇪' },
  { code: 'IL', dialCode: '+972', flag: '🇮🇱' },
  { code: 'IT', dialCode: '+39', flag: '🇮🇹' },
  { code: 'JM', dialCode: '+1-876', flag: '🇯🇲' },
  { code: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { code: 'JO', dialCode: '+962', flag: '🇯🇴' },
  { code: 'KZ', dialCode: '+7', flag: '🇰🇿' },
  { code: 'KE', dialCode: '+254', flag: '🇰🇪' },
  { code: 'KI', dialCode: '+686', flag: '🇰🇮' },
  { code: 'KW', dialCode: '+965', flag: '🇰🇼' },
  { code: 'KG', dialCode: '+996', flag: '🇰🇬' },
  { code: 'LA', dialCode: '+856', flag: '🇱🇦' },
  { code: 'LV', dialCode: '+371', flag: '🇱🇻' },
  { code: 'LB', dialCode: '+961', flag: '🇱🇧' },
  { code: 'LS', dialCode: '+266', flag: '🇱🇸' },
  { code: 'LR', dialCode: '+231', flag: '🇱🇷' },
  { code: 'LY', dialCode: '+218', flag: '🇱🇾' },
  { code: 'LI', dialCode: '+423', flag: '🇱🇮' },
  { code: 'LT', dialCode: '+370', flag: '🇱🇹' },
  { code: 'LU', dialCode: '+352', flag: '🇱🇺' },
  { code: 'MG', dialCode: '+261', flag: '🇲🇬' },
  { code: 'MW', dialCode: '+265', flag: '🇲🇼' },
  { code: 'MY', dialCode: '+60', flag: '🇲🇾' },
  { code: 'MV', dialCode: '+960', flag: '🇲🇻' },
  { code: 'ML', dialCode: '+223', flag: '🇲🇱' },
  { code: 'MT', dialCode: '+356', flag: '🇲🇹' },
  { code: 'MH', dialCode: '+692', flag: '🇲🇭' },
  { code: 'MR', dialCode: '+222', flag: '🇲🇷' },
  { code: 'MU', dialCode: '+230', flag: '🇲🇺' },
  { code: 'MX', dialCode: '+52', flag: '🇲🇽' },
  { code: 'FM', dialCode: '+691', flag: '🇫🇲' },
  { code: 'MD', dialCode: '+373', flag: '🇲🇩' },
  { code: 'MC', dialCode: '+377', flag: '🇲🇨' },
  { code: 'MN', dialCode: '+976', flag: '🇲🇳' },
  { code: 'ME', dialCode: '+382', flag: '🇲🇪' },
  { code: 'MA', dialCode: '+212', flag: '🇲🇦' },
  { code: 'MZ', dialCode: '+258', flag: '🇲🇿' },
  { code: 'MM', dialCode: '+95', flag: '🇲🇲' },
  { code: 'NA', dialCode: '+264', flag: '🇳🇦' },
  { code: 'NR', dialCode: '+674', flag: '🇳🇷' },
  { code: 'NP', dialCode: '+977', flag: '🇳🇵' },
  { code: 'NL', dialCode: '+31', flag: '🇳🇱' },
  { code: 'NZ', dialCode: '+64', flag: '🇳🇿' },
  { code: 'NI', dialCode: '+505', flag: '🇳🇮' },
  { code: 'NE', dialCode: '+227', flag: '🇳🇪' },
  { code: 'NG', dialCode: '+234', flag: '🇳🇬' },
  { code: 'NO', dialCode: '+47', flag: '🇳🇴' },
  { code: 'OM', dialCode: '+968', flag: '🇴🇲' },
  { code: 'PK', dialCode: '+92', flag: '🇵🇰' },
  { code: 'PW', dialCode: '+680', flag: '🇵🇼' },
  { code: 'PA', dialCode: '+507', flag: '🇵🇦' },
  { code: 'PG', dialCode: '+675', flag: '🇵🇬' },
  { code: 'PY', dialCode: '+595', flag: '🇵🇾' },
  { code: 'PE', dialCode: '+51', flag: '🇵🇪' },
  { code: 'PH', dialCode: '+63', flag: '🇵🇭' },
  { code: 'PL', dialCode: '+48', flag: '🇵🇱' },
  { code: 'PT', dialCode: '+351', flag: '🇵🇹' },
  { code: 'QA', dialCode: '+974', flag: '🇶🇦' },
  { code: 'RO', dialCode: '+40', flag: '🇷🇴' },
  { code: 'RU', dialCode: '+7', flag: '🇷🇺' },
  { code: 'RW', dialCode: '+250', flag: '🇷🇼' },
  { code: 'KN', dialCode: '+1-869', flag: '🇰🇳' },
  { code: 'LC', dialCode: '+1-758', flag: '🇱🇨' },
  { code: 'VC', dialCode: '+1-784', flag: '🇻🇨' },
  { code: 'WS', dialCode: '+685', flag: '🇼🇸' },
  { code: 'SM', dialCode: '+378', flag: '🇸🇲' },
  { code: 'ST', dialCode: '+239', flag: '🇸🇹' },
  { code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { code: 'SN', dialCode: '+221', flag: '🇸🇳' },
  { code: 'RS', dialCode: '+381', flag: '🇷🇸' },
  { code: 'SC', dialCode: '+248', flag: '🇸🇨' },
  { code: 'SL', dialCode: '+232', flag: '🇸🇱' },
  { code: 'SG', dialCode: '+65', flag: '🇸🇬' },
  { code: 'SK', dialCode: '+421', flag: '🇸🇰' },
  { code: 'SI', dialCode: '+386', flag: '🇸🇮' },
  { code: 'SB', dialCode: '+677', flag: '🇸🇧' },
  { code: 'SO', dialCode: '+252', flag: '🇸🇴' },
  { code: 'ZA', dialCode: '+27', flag: '🇿🇦' },
  { code: 'SS', dialCode: '+211', flag: '🇸🇸' },
  { code: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { code: 'LK', dialCode: '+94', flag: '🇱🇰' },
  { code: 'SD', dialCode: '+249', flag: '🇸🇩' },
  { code: 'SR', dialCode: '+597', flag: '🇸🇷' },
  { code: 'SE', dialCode: '+46', flag: '🇸🇪' },
  { code: 'CH', dialCode: '+41', flag: '🇨🇭' },
  { code: 'SY', dialCode: '+963', flag: '🇸🇾' },
  { code: 'TW', dialCode: '+886', flag: '🇹🇼' },
  { code: 'TJ', dialCode: '+992', flag: '🇹🇯' },
  { code: 'TZ', dialCode: '+255', flag: '🇹🇿' },
  { code: 'TH', dialCode: '+66', flag: '🇹🇭' },
  { code: 'TL', dialCode: '+670', flag: '🇹🇱' },
  { code: 'TG', dialCode: '+228', flag: '🇹🇬' },
  { code: 'TO', dialCode: '+676', flag: '🇹🇴' },
  { code: 'TT', dialCode: '+1-868', flag: '🇹🇹' },
  { code: 'TN', dialCode: '+216', flag: '🇹🇳' },
  { code: 'TR', dialCode: '+90', flag: '🇹🇷' },
  { code: 'TM', dialCode: '+993', flag: '🇹🇲' },
  { code: 'TV', dialCode: '+688', flag: '🇹🇻' },
  { code: 'UG', dialCode: '+256', flag: '🇺🇬' },
  { code: 'UA', dialCode: '+380', flag: '🇺🇦' },
  { code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { code: 'UY', dialCode: '+598', flag: '🇺🇾' },
  { code: 'UZ', dialCode: '+998', flag: '🇺🇿' },
  { code: 'VU', dialCode: '+678', flag: '🇻🇺' },
  { code: 'VE', dialCode: '+58', flag: '🇻🇪' },
  { code: 'VN', dialCode: '+84', flag: '🇻🇳' },
  { code: 'YE', dialCode: '+967', flag: '🇾🇪' },
  { code: 'ZM', dialCode: '+260', flag: '🇿🇲' },
  { code: 'ZW', dialCode: '+263', flag: '🇿🇼' },
]

// Map app language codes to BCP 47 locale tags for Intl.DisplayNames
const LANG_TO_LOCALE: Record<string, string> = {
  es: 'es',
  'es-ar': 'es-AR',
  en: 'en',
  pt: 'pt',
  qu: 'es', // Quechua not supported by Intl, fall back to Spanish
}

interface CountryWithName extends Country {
  name: string
}

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
}

// Search placeholder per locale
const SEARCH_PLACEHOLDER: Record<string, string> = {
  es: 'Buscar país...',
  'es-ar': 'Buscar país...',
  en: 'Search country...',
  pt: 'Buscar país...',
  qu: 'Buscar país...',
}

const NO_RESULTS: Record<string, string> = {
  es: 'Sin resultados',
  'es-ar': 'Sin resultados',
  en: 'No results',
  pt: 'Sem resultados',
  qu: 'Sin resultados',
}

export default function PhoneInput({ value, onChange, placeholder, label, error }: PhoneInputProps) {
  const { language } = useLanguage()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCode, setSelectedCode] = useState('AR')
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Resolve country names using Intl.DisplayNames for the current language
  const countries: CountryWithName[] = useMemo(() => {
    const locale = LANG_TO_LOCALE[language] ?? 'es'
    let displayNames: Intl.DisplayNames
    try {
      displayNames = new Intl.DisplayNames([locale], { type: 'region' })
    } catch {
      displayNames = new Intl.DisplayNames(['es'], { type: 'region' })
    }
    return COUNTRY_DATA.map(c => ({
      ...c,
      name: displayNames.of(c.code) ?? c.code,
    })).sort((a, b) => a.name.localeCompare(b.name, locale))
  }, [language])

  const selected = useMemo(
    () => countries.find(c => c.code === selectedCode) ?? countries[0],
    [countries, selectedCode]
  )

  // Extract just the number part (after dial code) from the full value
  const numberPart = useMemo(() => {
    if (value.startsWith(selected.dialCode)) {
      return value.slice(selected.dialCode.length).trimStart()
    }
    return value
  }, [value, selected.dialCode])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return countries.filter(
      c => c.name.toLowerCase().includes(q) || c.dialCode.includes(q) || c.code.toLowerCase().includes(q)
    )
  }, [search, countries])

  const selectCountry = (country: CountryWithName) => {
    setSelectedCode(country.code)
    setOpen(false)
    setSearch('')
    onChange(`${country.dialCode} ${numberPart}`.trim())
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value
    onChange(num ? `${selected.dialCode} ${num}` : '')
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div ref={ref} className="relative flex gap-0">
        {/* Country selector button */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 py-2.5 text-sm hover:bg-gray-100 transition-colors focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 whitespace-nowrap"
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="text-gray-600 font-medium">{selected.dialCode}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Number input */}
        <input
          type="tel"
          value={numberPart}
          onChange={handleNumberChange}
          placeholder={placeholder ?? '11 1234-5678'}
          className="flex-1 rounded-r-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
        />

        {/* Dropdown */}
        {open && (
          <div className="absolute left-0 top-full mt-1.5 w-80 max-h-72 rounded-xl border border-gray-100 bg-white shadow-xl z-50 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-gray-100 flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={SEARCH_PLACEHOLDER[language] ?? 'Buscar país...'}
                className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">
                  {NO_RESULTS[language] ?? 'Sin resultados'}
                </p>
              ) : (
                filtered.map(country => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => selectCountry(country)}
                    className={`flex items-center gap-3 w-full px-3 py-2 text-sm text-left transition-colors hover:bg-gray-50 ${
                      selected.code === country.code ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <span className="text-base shrink-0">{country.flag}</span>
                    <span className="flex-1 truncate">{country.name}</span>
                    <span className="text-gray-400 font-mono text-xs shrink-0">{country.dialCode}</span>
                    {selected.code === country.code && <span className="text-green-500 text-xs">✓</span>}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

