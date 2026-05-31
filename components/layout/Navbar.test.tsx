import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { axe } from 'vitest-axe'
import Navbar from './Navbar'

const mockPush = vi.fn()
const mockT = vi.fn((key: string) => {
  const map: Record<string, string> = {
    'nav.products': 'Productos',
    'nav.howItWorks': 'Cómo funciona',
    'nav.myPanel': 'Mi panel',
    'nav.profile': 'Perfil',
    'nav.dashboard': 'Dashboard',
    'nav.admin': 'Admin',
    'nav.logout': 'Cerrar sesión',
    'nav.login': 'Iniciar sesión',
    'nav.register': 'Registrarse',
  }
  return map[key] || key
})

const mockLogout = vi.hoisted(() => vi.fn())
const mockAuthValue = vi.hoisted(() => {
  const obj: {
    current: {
      user: Record<string, unknown> | null
      isAuthenticated: boolean
      isAdmin: boolean
      logout: ReturnType<typeof vi.fn>
    }
  } = {
    current: {
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      logout: vi.fn(),
    },
  }
  return obj
})

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockAuthValue.current,
}))

vi.mock('@/contexts/language-context', () => ({
  useLanguage: () => ({ language: 'es', setLanguage: vi.fn(), t: mockT }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/stores/site-config-store', () => ({
  useSiteConfigStore: () => ({
    config: null,
  }),
}))

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt as string} />
  },
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  },
}))

beforeEach(() => {
  mockLogout.mockReset()
  mockPush.mockReset()
  mockAuthValue.current = {
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    logout: mockLogout,
  }
})

describe('Navbar', () => {
  describe('unauthenticated', () => {
    it('renders logo and site name', () => {
      render(<Navbar />)
      expect(screen.getByText('INTI')).toBeDefined()
    })

    it('renders login and register links', () => {
      render(<Navbar />)
      expect(screen.getByText('Iniciar sesión')).toBeDefined()
      expect(screen.getByText('Registrarse')).toBeDefined()
    })

    it('does not render user dropdown', () => {
      render(<Navbar />)
      expect(screen.queryByText('Cerrar sesión')).toBeNull()
      expect(screen.queryByText('Mi panel')).toBeNull()
    })
  })

  describe('authenticated', () => {
    beforeEach(() => {
      mockAuthValue.current = {
        user: {
          _id: 'u1',
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@test.com',
          role: 'user' as const,
          locations: [],
          isActive: true,
          createdAt: '',
        },
        isAuthenticated: true,
        isAdmin: false,
        logout: mockLogout,
      }
    })

    it('shows user initials in avatar', () => {
      render(<Navbar />)
      expect(screen.getByText('JP')).toBeDefined()
    })

    it('shows my panel link', () => {
      render(<Navbar />)
      expect(screen.getByText('Mi panel')).toBeDefined()
    })
  })

  describe('admin', () => {
    beforeEach(() => {
      mockAuthValue.current = {
        user: {
          _id: 'u2',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@test.com',
          role: 'admin' as const,
          locations: [],
          isActive: true,
          createdAt: '',
        },
        isAuthenticated: true,
        isAdmin: true,
        logout: mockLogout,
      }
    })

    it('shows admin link in dropdown', () => {
      render(<Navbar />)
      act(() => screen.getByText('AU').click())
      expect(screen.getByText('Admin')).toBeDefined()
    })
  })

  describe('a11y', () => {
    it('has no violations for unauthenticated state', async () => {
      const { container } = render(<Navbar />)
      const results = await axe(container)
      expect(results.violations).toHaveLength(0)
    })

    it('has no violations for authenticated state', async () => {
      mockAuthValue.current = {
        user: {
          _id: 'u1',
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@test.com',
          role: 'user' as const,
          locations: [],
          isActive: true,
          createdAt: '',
        },
        isAuthenticated: true,
        isAdmin: false,
        logout: mockLogout,
      }
      const { container } = render(<Navbar />)
      const results = await axe(container)
      expect(results.violations).toHaveLength(0)
    })

    it('has no violations for admin state', async () => {
      mockAuthValue.current = {
        user: {
          _id: 'u2',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@test.com',
          role: 'admin' as const,
          locations: [],
          isActive: true,
          createdAt: '',
        },
        isAuthenticated: true,
        isAdmin: true,
        logout: mockLogout,
      }
      const { container } = render(<Navbar />)
      const results = await axe(container)
      expect(results.violations).toHaveLength(0)
    })
  })
})
