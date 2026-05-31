import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './auth-context'

const mockLogin = vi.hoisted(() => vi.fn())
const mockRegister = vi.hoisted(() => vi.fn())
const mockLogout = vi.hoisted(() => vi.fn(() => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}))
const mockGetMe = vi.hoisted(() => vi.fn())
const mockJwtDecode = vi.hoisted(() => vi.fn())

vi.mock('@/services/auth-service', () => ({
  login: mockLogin,
  register: mockRegister,
  logout: mockLogout,
  getMe: mockGetMe,
}))

vi.mock('jwt-decode', () => ({
  jwtDecode: mockJwtDecode,
}))

function TestConsumer() {
  const { user, isAuthenticated, isAdmin, loading, login, register, logout } = useAuth()
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="authenticated">{String(isAuthenticated)}</div>
      <div data-testid="admin">{String(isAdmin)}</div>
      {user && <div data-testid="user-email">{user.email}</div>}
      {user && <div data-testid="user-role">{user.role}</div>}
      <button data-testid="btn-login" onClick={() => login('a@b.com', 'pass')}>login</button>
      <button data-testid="btn-register" onClick={() => register({ firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'pass', acceptedTerms: true, acceptedPrivacy: true })}>register</button>
      <button data-testid="btn-logout" onClick={logout}>logout</button>
    </div>
  )
}

function renderProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  )
}

beforeEach(() => {
  mockLogin.mockReset()
  mockRegister.mockReset()
  mockLogout.mockReset()
  mockGetMe.mockReset()
  mockJwtDecode.mockReset()
  localStorage.clear()
})

describe('initial state', () => {
  it('shows not authenticated when no token', async () => {
    renderProvider()
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
    expect(screen.getByTestId('authenticated').textContent).toBe('false')
  })
})

describe('with valid token', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'valid-jwt')
    mockJwtDecode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 })
  })

  it('loads user from API', async () => {
    const mockUser = { _id: 'u1', firstName: 'Juan', lastName: 'Pérez', email: 'juan@test.com', role: 'user' as const, locations: [], isActive: true, createdAt: '' }
    mockGetMe.mockResolvedValue(mockUser)

    renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
    expect(screen.getByTestId('authenticated').textContent).toBe('true')
    expect(screen.getByTestId('user-email').textContent).toBe('juan@test.com')
    expect(screen.getByTestId('admin').textContent).toBe('false')
  })

  it('sets isAdmin when role is admin', async () => {
    const adminUser = { _id: 'u2', firstName: 'Admin', lastName: 'User', email: 'admin@test.com', role: 'admin' as const, locations: [], isActive: true, createdAt: '' }
    mockGetMe.mockResolvedValue(adminUser)

    renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId('admin').textContent).toBe('true')
    })
    expect(screen.getByTestId('user-role').textContent).toBe('admin')
  })

  it('logs out on API error', async () => {
    mockGetMe.mockRejectedValue(new Error('Unauthorized'))

    renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false')
    })
    expect(localStorage.getItem('token')).toBeNull()
  })
})

describe('with expired token', () => {
  it('removes token without calling API', async () => {
    localStorage.setItem('token', 'expired-jwt')
    mockJwtDecode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) - 3600 })

    renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
    expect(screen.getByTestId('authenticated').textContent).toBe('false')
    expect(mockGetMe).not.toHaveBeenCalled()
    expect(localStorage.getItem('token')).toBeNull()
  })
})

describe('login function', () => {
  it('calls service and sets user', async () => {
    const mockUser = { _id: 'u1', firstName: 'Juan', lastName: 'Pérez', email: 'juan@test.com', role: 'user' as const, locations: [], isActive: true, createdAt: '' }
    mockLogin.mockResolvedValue({ user: mockUser, token: 'new-token' })

    renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    await act(async () => {
      screen.getByTestId('btn-login').click()
    })

    expect(screen.getByTestId('authenticated').textContent).toBe('true')
    expect(screen.getByTestId('user-email').textContent).toBe('juan@test.com')
  })
})

describe('register function', () => {
  it('calls service and sets user', async () => {
    const mockUser = { _id: 'u1', firstName: 'A', lastName: 'B', email: 'a@b.com', role: 'user' as const, locations: [], isActive: true, createdAt: '' }
    mockRegister.mockResolvedValue({ user: mockUser, token: 'new-token' })

    renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    await act(async () => {
      screen.getByTestId('btn-register').click()
    })

    expect(screen.getByTestId('authenticated').textContent).toBe('true')
    expect(screen.getByTestId('user-email').textContent).toBe('a@b.com')
  })
})

describe('logout function', () => {
  it('clears user and calls service logout', async () => {
    localStorage.setItem('token', 'valid-jwt')
    mockJwtDecode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 })
    mockGetMe.mockResolvedValue({ _id: 'u1', firstName: 'Juan', lastName: 'Pérez', email: 'juan@test.com', role: 'user' as const, locations: [], isActive: true, createdAt: '' })

    renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true')
    })

    await act(async () => {
      screen.getByTestId('btn-logout').click()
    })

    expect(screen.getByTestId('authenticated').textContent).toBe('false')
    expect(mockLogout).toHaveBeenCalled()
  })
})
