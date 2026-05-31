import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { axe } from 'vitest-axe'
import CookieConsentBanner from './CookieConsentBanner'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  },
}))

beforeEach(() => {
  localStorage.clear()
  document.cookie = ''
})

describe('CookieConsentBanner', () => {
  it('shows banner when no consent saved', () => {
    render(<CookieConsentBanner />)
    expect(screen.getByText('Uso de cookies')).toBeDefined()
    expect(screen.getByText('Solo necesarias')).toBeDefined()
    expect(screen.getByText('Aceptar todas')).toBeDefined()
  })

  it('hides banner when consent already saved', () => {
    localStorage.setItem(
      'inti_cookie_consent_v1',
      JSON.stringify({
        necessary: true,
        analytics: false,
        marketing: false,
        updatedAt: '2024-01-01T00:00:00Z',
      }),
    )
    render(<CookieConsentBanner />)
    expect(screen.queryByText('Uso de cookies')).toBeNull()
  })

  it('hides banner on accept all', () => {
    render(<CookieConsentBanner />)
    act(() => screen.getByText('Aceptar todas').click())
    expect(screen.queryByText('Uso de cookies')).toBeNull()
    const saved = JSON.parse(localStorage.getItem('inti_cookie_consent_v1') ?? '{}')
    expect(saved.analytics).toBe(true)
    expect(saved.marketing).toBe(true)
  })

  it('hides banner on accept necessary only', () => {
    render(<CookieConsentBanner />)
    act(() => screen.getByText('Solo necesarias').click())
    expect(screen.queryByText('Uso de cookies')).toBeNull()
    const saved = JSON.parse(localStorage.getItem('inti_cookie_consent_v1') ?? '{}')
    expect(saved.analytics).toBe(false)
    expect(saved.marketing).toBe(false)
  })

  it('opens configuration panel', () => {
    render(<CookieConsentBanner />)
    expect(screen.queryByText('Cookies analíticas')).toBeNull()
    act(() => screen.getByText('Configurar').click())
    expect(screen.getByText('Cookies analíticas')).toBeDefined()
    expect(screen.getByText('Cookies de marketing')).toBeDefined()
  })

  it('saves custom configuration', () => {
    render(<CookieConsentBanner />)
    act(() => screen.getByText('Configurar').click())
    act(() => screen.getByText('Guardar configuración').click())
    expect(screen.queryByText('Uso de cookies')).toBeNull()
  })

  it('includes link to cookies policy', () => {
    render(<CookieConsentBanner />)
    const link = screen.getByText('Política de Cookies')
    expect(link).toBeDefined()
    expect(link.closest('a')?.getAttribute('href')).toBe('/legal/cookies')
  })

  describe('a11y', () => {
    it('has no violations when visible', async () => {
      const { container } = render(<CookieConsentBanner />)
      const results = await axe(container)
      expect(results.violations).toHaveLength(0)
    })
  })
})
