import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGet = vi.fn()
const mockPatch = vi.fn()
const mockPost = vi.fn()
const mockPostForm = vi.fn()
const mockDel = vi.fn()
vi.mock('@/utils/api', () => ({
  get: mockGet,
  patch: mockPatch,
  post: mockPost,
  postForm: mockPostForm,
  del: mockDel,
}))

const { updateProfile, updateLegalConsent, uploadAvatar, addLocation, removeLocation, getAllUsers, toggleUserActive, changeUserRole } = await import('./user-service')

beforeEach(() => {
  mockGet.mockReset()
  mockPatch.mockReset()
  mockPost.mockReset()
  mockPostForm.mockReset()
  mockDel.mockReset()
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

describe('updateProfile', () => {
  it('calls PATCH /users/me with data', async () => {
    mockPatch.mockResolvedValue({ ...mockUser, firstName: 'Carlos' })
    const result = await updateProfile({ firstName: 'Carlos' })
    expect(mockPatch).toHaveBeenCalledWith('/users/me', { firstName: 'Carlos' })
    expect(result.firstName).toBe('Carlos')
  })
})

describe('updateLegalConsent', () => {
  it('calls PATCH /users/me/legal-consent', async () => {
    mockPatch.mockResolvedValue(mockUser)
    const data = { acceptedTerms: true, acceptedPrivacy: true, marketingConsent: true }
    const result = await updateLegalConsent(data)
    expect(mockPatch).toHaveBeenCalledWith('/users/me/legal-consent', data)
    expect(result).toEqual(mockUser)
  })
})

describe('uploadAvatar', () => {
  it('sends FormData to POST /users/me/avatar', async () => {
    mockPostForm.mockResolvedValue({ ...mockUser, avatar: 'https://img.com/avatar.jpg' })
    const file = new File([''], 'avatar.png', { type: 'image/png' })
    const result = await uploadAvatar(file)
    expect(mockPostForm).toHaveBeenCalledWith('/users/me/avatar', expect.any(FormData))
    expect(result.avatar).toBe('https://img.com/avatar.jpg')
  })
})

describe('addLocation', () => {
  it('calls POST /users/me/locations', async () => {
    mockPost.mockResolvedValue(mockUser)
    const loc = { name: 'Finca', province: 'Córdoba', municipality: 'Colón' }
    await addLocation(loc)
    expect(mockPost).toHaveBeenCalledWith('/users/me/locations', loc)
  })
})

describe('removeLocation', () => {
  it('calls DELETE /users/me/locations/:index', async () => {
    mockDel.mockResolvedValue(mockUser)
    await removeLocation(0)
    expect(mockDel).toHaveBeenCalledWith('/users/me/locations/0')
  })
})

describe('getAllUsers', () => {
  it('calls GET /admin/users with pagination', async () => {
    mockGet.mockResolvedValue({ users: [mockUser], total: 1 })
    const result = await getAllUsers(1, 50)
    expect(mockGet).toHaveBeenCalledWith('/admin/users?page=1&limit=50')
    expect(result.users).toHaveLength(1)
  })
})

describe('toggleUserActive', () => {
  it('calls PATCH /admin/users/:id/toggle-active', async () => {
    mockPatch.mockResolvedValue({ ...mockUser, isActive: false })
    const result = await toggleUserActive('u1')
    expect(mockPatch).toHaveBeenCalledWith('/admin/users/u1/toggle-active', {})
    expect(result.isActive).toBe(false)
  })
})

describe('changeUserRole', () => {
  it('calls PATCH /admin/users/:id/role', async () => {
    mockPatch.mockResolvedValue({ ...mockUser, role: 'admin' })
    const result = await changeUserRole('u1', 'admin')
    expect(mockPatch).toHaveBeenCalledWith('/admin/users/u1/role', { role: 'admin' })
    expect(result.role).toBe('admin')
  })
})
