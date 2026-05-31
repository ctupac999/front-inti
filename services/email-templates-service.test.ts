import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGet = vi.fn()
const mockPut = vi.fn()
const mockPost = vi.fn()
const mockDel = vi.fn()
vi.mock('@/utils/api', () => ({
  get: mockGet,
  put: mockPut,
  post: mockPost,
  del: mockDel,
}))

const { getAllEmailTemplates, getEmailTemplate, upsertEmailTemplate, deleteEmailTemplate, previewEmailTemplate } = await import('./email-templates-service')

beforeEach(() => {
  mockGet.mockReset()
  mockPut.mockReset()
  mockPost.mockReset()
  mockDel.mockReset()
})

const mockTemplate = {
  _id: 'tpl1',
  key: 'USER_REGISTRATION',
  locale: 'es',
  subject: 'Bienvenido',
  html: '<p>Hola</p>',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('getAllEmailTemplates', () => {
  it('calls GET /email-templates without filter', async () => {
    mockGet.mockResolvedValue([mockTemplate])
    const result = await getAllEmailTemplates()
    expect(mockGet).toHaveBeenCalledWith('/email-templates')
    expect(result).toHaveLength(1)
  })

  it('calls GET /email-templates with key filter', async () => {
    mockGet.mockResolvedValue([mockTemplate])
    await getAllEmailTemplates('USER_REGISTRATION')
    expect(mockGet).toHaveBeenCalledWith('/email-templates?key=USER_REGISTRATION')
  })
})

describe('getEmailTemplate', () => {
  it('calls GET /email-templates/:key/:locale', async () => {
    mockGet.mockResolvedValue(mockTemplate)
    const result = await getEmailTemplate('USER_REGISTRATION', 'es')
    expect(mockGet).toHaveBeenCalledWith('/email-templates/USER_REGISTRATION/es')
    expect(result._id).toBe('tpl1')
  })
})

describe('upsertEmailTemplate', () => {
  it('calls PUT /email-templates/:key/:locale', async () => {
    mockPut.mockResolvedValue(mockTemplate)
    const data = { subject: 'Bienvenido', html: '<p>Hola</p>' }
    const result = await upsertEmailTemplate('USER_REGISTRATION', 'es', data)
    expect(mockPut).toHaveBeenCalledWith('/email-templates/USER_REGISTRATION/es', data)
    expect(result).toEqual(mockTemplate)
  })
})

describe('deleteEmailTemplate', () => {
  it('calls DELETE /email-templates/:key/:locale', async () => {
    mockDel.mockResolvedValue({ deleted: true })
    const result = await deleteEmailTemplate('USER_REGISTRATION', 'es')
    expect(mockDel).toHaveBeenCalledWith('/email-templates/USER_REGISTRATION/es')
    expect(result.deleted).toBe(true)
  })
})

describe('previewEmailTemplate', () => {
  it('calls POST /email-templates/:key/:locale/preview', async () => {
    mockPost.mockResolvedValue({ subject: 'Hola Juan', html: '<p>Hola Juan</p>' })
    const result = await previewEmailTemplate('USER_REGISTRATION', 'es', { firstName: 'Juan' })
    expect(mockPost).toHaveBeenCalledWith('/email-templates/USER_REGISTRATION/es/preview', { firstName: 'Juan' })
    expect(result.subject).toBe('Hola Juan')
  })
})
