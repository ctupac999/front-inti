'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { availableLanguages, languageInfo, type Language } from '@/config/languages'
import { ChevronDown } from 'lucide-react'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = languageInfo[language]

  return (
    <div className="relative" ref={ref} suppressHydrationWarning>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline">{current.nativeName}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-40 rounded-xl border border-gray-100 bg-white shadow-lg py-1 z-50"
          role="listbox"
          suppressHydrationWarning
        >
          {availableLanguages.map((lang) => {
            const info = languageInfo[lang]
            const isActive = lang === language
            return (
              <button
                key={lang}
                role="option"
                aria-selected={isActive}
                onClick={() => { setLanguage(lang as Language); setOpen(false) }}
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-base">{info.flag}</span>
                <span>{info.nativeName}</span>
                {isActive && <span className="ml-auto text-green-500">✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
