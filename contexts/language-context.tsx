'use client'

import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from 'react'
import { createTranslator } from 'next-intl'
import translations from '@/translations'
import {
  type Language,
  availableLanguages,
  defaultLanguage,
  getInitialLanguage,
  saveLanguage,
} from '@/config/languages'

export type { Language }
export { availableLanguages }

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Convert flat keys "a.b.c" to nested objects for next-intl
function toNestedMessages(flat: Record<string, string>): Record<string, unknown> {
  const root: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.')
    let cursor = root
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (i === parts.length - 1) {
        cursor[part] = value
      } else {
        if (typeof cursor[part] !== 'object') cursor[part] = {}
        cursor = cursor[part] as Record<string, unknown>
      }
    }
  }
  return root
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>(getInitialLanguage)

  const changeLanguage = (lang: Language) => {
    setLang(lang)
    saveLanguage(lang)
  }

  const messages = useMemo(() => {
    const base = translations[defaultLanguage] as Record<string, string>
    const lang = translations[language] as Record<string, string> | undefined
    // Merge: base (es) + language overrides so no keys are ever missing
    const merged = lang ? { ...base, ...lang } : base
    return toNestedMessages(merged)
  }, [language])

  const fallbackMessages = useMemo(
    () => toNestedMessages(translations[defaultLanguage] as Record<string, string>),
    []
  )

  const translator = useMemo(
    () => createTranslator({ locale: language, messages }),
    [language, messages]
  )

  const fallbackTranslator = useMemo(
    () => createTranslator({ locale: defaultLanguage, messages: fallbackMessages }),
    [fallbackMessages]
  )

  const t = (key: string, params?: Record<string, string | number>): string => {
    try {
      return translator(key as never, params as never)
    } catch {
      try {
        return fallbackTranslator(key as never, params as never)
      } catch {
        return key
      }
    }
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}
