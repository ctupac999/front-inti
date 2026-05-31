import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import LegalConsentGuard from './LegalConsentGuard'

const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockPathname = vi.fn(() => '/dashboard')

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => mockPathname(),
}))

const mockGetLegalVersion = vi.hoisted(() => vi.fn())
vi.mock('@/services/legal-service', () => ({
  getLegalVersion: mockGetLegalVersion,
}))

const mockAuthValue = vi.hoisted(() => {
  const obj: {
    current: {
      user: Record<string, unknown> | null
      loading: boolean
    }
  } = {
    current: {
      user: null,
      loading: true,
    },
  }
  return obj
})

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockAuthValue.current,
}))

beforeEach(() => {
  mockPush.mockReset()
  mockReplace.mockReset()
  mockPathname.mockReset()
  mockPathname.mockReturnValue('/dashboard')
  mockGetLegalVersion.mockReset()
  mockGetLegalVersion.mockResolvedValue({
    legalVersion: 'v1.0',
    termsUrl: '/legal/terms',
    privacyUrl: '/legal/privacy',
    consentUrl: '/legal/consent',
    updatedAt: '2024-01-01T00:00:00Z',
  })
  mockAuthValue.current = { user: null, loading: true }
})

describe('LegalConsentGuard', () => {
  it('renders null while loading', () => {
    const { container } = render(<LegalConsentGuard />)
    expect(container.innerHTML).toBe('')
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('renders null on public paths', () => {
    mockPathname.mockReturnValue('/auth/login')
    mockAuthValue.current = {
      user: {
        _id: 'u1',
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
        role: 'user' as const,
        locations: [],
        isActive: true,
        createdAt: '',
      },
      loading: false,
    }

    const { container } = render(<LegalConsentGuard />)
    expect(container.innerHTML).toBe('')
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('redirects to /legal/consent when consent is missing', async () => {
    mockGetLegalVersion.mockResolvedValue({
      legalVersion: 'v1.0',
      termsUrl: '/legal/terms',
      privacyUrl: '/legal/privacy',
      consentUrl: '/legal/consent',
      updatedAt: '2024-01-01T00:00:00Z',
    })

    mockAuthValue.current = {
      user: {
        _id: 'u1',
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
        role: 'user' as const,
        locations: [],
        isActive: true,
        createdAt: '',
      },
      loading: false,
    }

    render(<LegalConsentGuard />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/legal/consent')
    })
  })

  it('redirects when legal version is outdated', async () => {
    mockGetLegalVersion.mockResolvedValue({
      legalVersion: 'v2.0',
      termsUrl: '/legal/terms',
      privacyUrl: '/legal/privacy',
      consentUrl: '/legal/consent',
      updatedAt: '2024-06-01T00:00:00Z',
    })

    mockAuthValue.current = {
      user: {
        _id: 'u1',
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
        role: 'user' as const,
        locations: [],
        isActive: true,
        createdAt: '',
        acceptedTermsAt: '2024-01-01T00:00:00Z',
        acceptedPrivacyAt: '2024-01-01T00:00:00Z',
        legalVersion: 'v1.0',
      },
      loading: false,
    }

    render(<LegalConsentGuard />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/legal/consent')
    })
  })

  it('does not redirect when consent is up to date', async () => {
    mockGetLegalVersion.mockResolvedValue({
      legalVersion: 'v1.0',
      termsUrl: '/legal/terms',
      privacyUrl: '/legal/privacy',
      consentUrl: '/legal/consent',
      updatedAt: '2024-01-01T00:00:00Z',
    })

    mockAuthValue.current = {
      user: {
        _id: 'u1',
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
        role: 'user' as const,
        locations: [],
        isActive: true,
        createdAt: '',
        acceptedTermsAt: '2024-01-01T00:00:00Z',
        acceptedPrivacyAt: '2024-01-01T00:00:00Z',
        legalVersion: 'v1.0',
      },
      loading: false,
    }

    render(<LegalConsentGuard />)

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled()
    })
  })
})
