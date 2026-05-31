import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGet = vi.fn()
const mockPost = vi.fn()
vi.mock('@/utils/api', () => ({
  get: mockGet,
  post: mockPost,
}))

const { login, register, getMe, logout } = await import('./auth-service')

beforeEach(() => {
  mockGet.mockReset()
  mockPost.mockReset()
  localStorage.clear()
})

const mockUser = {
  _id: 'u1',
  firstName: 'Juan',
  lastName: 'Pérez',
  email: 'juan@test.com',
  role: 'user' as const,
  locations: [],
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
}

const mockAuthResponse = { user: mockUser, token: 'jwt-token' }

describe('login', () => {
  it('calls POST /auth/login and saves token + user', async () => {
    mockPost.mockResolvedValue(mockAuthResponse)

    const result = await login('juan@test.com', 'pass123')

    expect(mockPost).toHaveBeenCalledWith('/auth/login', {
      email: 'juan@test.com',
      password: 'pass123',
    })
    expect(localStorage.getItem('token')).toBe('jwt-token')
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser))
    expect(result).toEqual(mockAuthResponse)
  })
})

describe('register', () => {
  it('calls POST /auth/register and saves token', async () => {
    mockPost.mockResolvedValue(mockAuthResponse)

    const data = {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@test.com',
      password: 'pass123',
      acceptedTerms: true,
      acceptedPrivacy: true,
      legalVersion: 'v1.0',
    }
    const result = await register(data)

    expect(mockPost).toHaveBeenCalledWith('/auth/register', data)
    expect(localStorage.getItem('token')).toBe('jwt-token')
    expect(result).toEqual(mockAuthResponse)
  })
})

describe('getMe', () => {
  it('calls GET /users/me and returns user', async () => {
    mockGet.mockResolvedValue(mockUser)

    const result = await getMe()

    expect(mockGet).toHaveBeenCalledWith('/users/me')
    expect(result).toEqual(mockUser)
  })
})

describe('logout', () => {
  it('removes token and user from localStorage', () => {
    localStorage.setItem('token', 'jwt-token')
    localStorage.setItem('user', JSON.stringify(mockUser))

    logout()

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})
