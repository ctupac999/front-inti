import { describe, it, expect } from 'vitest'
import translations from '@/translations'

describe('translations', () => {
  it('has all required locales', () => {
    expect(translations).toHaveProperty('es')
    expect(translations).toHaveProperty('es-ar')
    expect(translations).toHaveProperty('en')
    expect(translations).toHaveProperty('pt')
    expect(translations).toHaveProperty('qu')
  })

  it('each locale has required keys', () => {
    const requiredKeys = [
      'nav.products',
      'home.hero.title1',
      'common.back',
      'legal.version',
      'admin.nav.dashboard',
    ]
    for (const locale of ['es', 'en', 'pt', 'qu'] as const) {
      for (const key of requiredKeys) {
        expect(translations[locale]).toHaveProperty(key)
      }
    }
  })

  it('es-ar overrides specific keys from es', () => {
    expect(translations['es-ar']['home.hero.title1']).toBe(
      'Intercambi\u00e1 lo que',
    )
    expect(translations['es-ar']['home.hero.title1']).not.toBe(
      translations.es['home.hero.title1'],
    )
  })

  it('has forgot and reset password keys in all locales', () => {
    const requiredKeys = [
      'auth.login.forgotPassword',
      'auth.forgotPassword.title',
      'auth.forgotPassword.emailLabel',
      'auth.forgotPassword.submit',
      'auth.forgotPassword.successTitle',
      'auth.forgotPassword.successMessage',
      'auth.forgotPassword.backToLogin',
      'auth.forgotPassword.error',
      'auth.resetPassword.title',
      'auth.resetPassword.newPasswordLabel',
      'auth.resetPassword.confirmPasswordLabel',
      'auth.resetPassword.submit',
      'auth.resetPassword.successTitle',
      'auth.resetPassword.successMessage',
      'auth.resetPassword.error',
    ]
    for (const locale of ['es', 'en', 'pt', 'qu'] as const) {
      for (const key of requiredKeys) {
        expect(translations[locale]).toHaveProperty(key)
      }
    }
  })
})
