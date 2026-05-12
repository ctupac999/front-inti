export type Language = 'es' | 'en' | 'pt' | 'qu'

export const availableLanguages: Language[] = ['es', 'en', 'pt', 'qu']

export const defaultLanguage: Language = 'es'

export const languageInfo: Record<Language, { name: string; nativeName: string; flag: string }> = {
  es: { name: 'Spanish',    nativeName: 'Español',    flag: '🇪🇸' },
  en: { name: 'English',    nativeName: 'English',    flag: '🇺🇸' },
  pt: { name: 'Portuguese', nativeName: 'Português',  flag: '🇧🇷' },
  qu: { name: 'Quechua',    nativeName: 'Runasimi',   flag: '🌄' },
}

export const isLanguageAvailable = (lang: string): lang is Language =>
  availableLanguages.includes(lang as Language)

export const detectBrowserLanguage = (): Language => {
  if (typeof window === 'undefined') return defaultLanguage
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const l of langs) {
    const code = l.toLowerCase().split('-')[0]
    if (isLanguageAvailable(code)) return code as Language
  }
  return defaultLanguage
}

export const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return defaultLanguage
  try {
    const saved = localStorage.getItem('inti_language')
    if (saved && isLanguageAvailable(saved)) return saved as Language
    return detectBrowserLanguage()
  } catch {
    return detectBrowserLanguage()
  }
}

export const saveLanguage = (lang: Language): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('inti_language', lang)
  } catch {}
}
