import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, renderHook, act } from '@testing-library/react'
import { LanguageProvider, useLanguage } from './language-context'

const mockTranslations = vi.hoisted(() => ({
  es: { 'nav.products': 'Productos', 'nav.login': 'Iniciar sesión', 'common.back': 'Volver', 'home.hero.title1': 'Intercambiá lo que cultivás' },
  'es-ar': { 'nav.products': 'Productos', 'nav.login': 'Iniciá sesión', 'home.hero.title1': 'Intercambiá lo que cultivás' },
  en: { 'nav.products': 'Products', 'nav.login': 'Log in', 'common.back': 'Back' },
}))

vi.mock('@/translations', () => ({
  default: mockTranslations,
}))

vi.mock('@/config/languages', () => ({
  defaultLanguage: 'es' as const,
  availableLanguages: ['es', 'es-ar', 'en', 'pt', 'qu'] as const,
  getInitialLanguage: () => 'es' as const,
  saveLanguage: vi.fn(),
  languageInfo: {
    es: { name: 'Spanish (Spain)', nativeName: 'Español', flag: '🇪🇸' },
    'es-ar': { name: 'Spanish (Argentina)', nativeName: 'Español (AR)', flag: '🇦🇷' },
    en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
    pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
    qu: { name: 'Quechua', nativeName: 'Runasimi', flag: '🌄' },
  },
}))

vi.mock('next-intl', () => {
  const fn = vi.fn(({ messages }: { messages: Record<string, unknown> }) => {
    return (key: string) => {
      const parts = key.split('.')
      let value: unknown = messages
      for (const part of parts) {
        if (typeof value !== 'object' || value === null) return key
        value = (value as Record<string, unknown>)[part]
      }
      return typeof value === 'string' ? value : key
    }
  })
  return { createTranslator: fn }
})

beforeEach(async () => {
  localStorage.clear()
  vi.clearAllMocks()
})

function TestConsumer() {
  const { language, setLanguage, t } = useLanguage()
  return (
    <div>
      <div data-testid="language">{language}</div>
      <div data-testid="translated">{t('nav.products')}</div>
      <div data-testid="missing">{t('nonexistent.key')}</div>
      <button data-testid="btn-es" onClick={() => setLanguage('es')}>ES</button>
      <button data-testid="btn-en" onClick={() => setLanguage('en')}>EN</button>
    </div>
  )
}

function renderProvider() {
  return render(
    <LanguageProvider>
      <TestConsumer />
    </LanguageProvider>,
  )
}

describe('LanguageProvider', () => {
  it('defaults to Spanish', () => {
    renderProvider()
    expect(screen.getByTestId('language').textContent).toBe('es')
  })

  it('translates known keys', () => {
    renderProvider()
    expect(screen.getByTestId('translated').textContent).toBe('Productos')
  })

  it('returns key as fallback for missing translations', () => {
    renderProvider()
    expect(screen.getByTestId('missing').textContent).toBe('nonexistent.key')
  })

  it('changes language and updates translation', async () => {
    renderProvider()
    expect(screen.getByTestId('translated').textContent).toBe('Productos')

    await act(async () => {
      screen.getByTestId('btn-en').click()
    })

    expect(screen.getByTestId('language').textContent).toBe('en')
    expect(screen.getByTestId('translated').textContent).toBe('Products')
  })

  it('calls saveLanguage on change', async () => {
    const { saveLanguage } = await import('@/config/languages')
    renderProvider()
    await act(async () => {
      screen.getByTestId('btn-en').click()
    })
    expect(saveLanguage).toHaveBeenCalledWith('en')
  })
})

describe('useLanguage hook', () => {
  it('throws when used outside provider', () => {
    expect(() => renderHook(() => useLanguage())).toThrow(
      'useLanguage must be used within a LanguageProvider',
    )
  })
})
