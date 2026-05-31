import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { axe } from 'vitest-axe'
import LanguageSwitcher from './LanguageSwitcher'

const mockSetLanguage = vi.fn()

vi.mock('@/contexts/language-context', () => ({
  useLanguage: () => ({
    language: 'es',
    setLanguage: mockSetLanguage,
  }),
}))

beforeEach(() => {
  mockSetLanguage.mockReset()
})

describe('LanguageSwitcher', () => {
  it('renders current language flag', () => {
    render(<LanguageSwitcher />)
    expect(screen.getByText('🇪🇸')).toBeDefined()
    expect(screen.getByText('Español')).toBeDefined()
  })

  it('opens dropdown on click', () => {
    render(<LanguageSwitcher />)
    const button = screen.getByRole('button')
    act(() => button.click())
    expect(screen.getByRole('listbox')).toBeDefined()
    expect(screen.getByText('English')).toBeDefined()
    expect(screen.getByText('Português')).toBeDefined()
  })

  it('calls setLanguage when option is clicked', () => {
    render(<LanguageSwitcher />)
    act(() => screen.getByRole('button').click())
    act(() => screen.getByText('English').click())
    expect(mockSetLanguage).toHaveBeenCalledWith('en')
  })

  it('highlights active language with checkmark', () => {
    render(<LanguageSwitcher />)
    act(() => screen.getByRole('button').click())
    const checkmark = screen.getByText('✓')
    expect(checkmark).toBeDefined()
  })

  describe('a11y', () => {
    it('has no violations when closed', async () => {
      const { container } = render(<LanguageSwitcher />)
      const results = await axe(container)
      expect(results.violations).toHaveLength(0)
    })
  })
})
