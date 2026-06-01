import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchClassifications, getAllClassifications, createClassification, updateClassification, deleteClassification } from './product-classification-service'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPatch = vi.fn()
const mockDel = vi.fn()

vi.mock('@/utils/api', () => ({
  get: (...args: unknown[]) => mockGet(...args),
  post: (...args: unknown[]) => mockPost(...args),
  patch: (...args: unknown[]) => mockPatch(...args),
  del: (...args: unknown[]) => mockDel(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('product-classification-service', () => {
  it('searchClassifications calls GET with query', async () => {
    mockGet.mockResolvedValue([{ name: 'papa', category: 'verduras' }])
    const result = await searchClassifications('papa')
    expect(mockGet).toHaveBeenCalledWith('/product-classification/search?q=papa')
    expect(result).toHaveLength(1)
  })

  it('getAllClassifications calls GET with pagination', async () => {
    mockGet.mockResolvedValue({ data: [], total: 0 })
    await getAllClassifications(1, 50)
    expect(mockGet).toHaveBeenCalledWith('/product-classification?page=1&limit=50')
  })

  it('createClassification calls POST', async () => {
    mockPost.mockResolvedValue({ name: 'tomate', category: 'verduras' })
    await createClassification({ name: 'tomate', category: 'verduras' })
    expect(mockPost).toHaveBeenCalledWith('/product-classification', { name: 'tomate', category: 'verduras' })
  })

  it('updateClassification calls PATCH', async () => {
    mockPatch.mockResolvedValue({ name: 'tomate', category: 'frutas' })
    await updateClassification('id123', { category: 'frutas' })
    expect(mockPatch).toHaveBeenCalledWith('/product-classification/id123', { category: 'frutas' })
  })

  it('deleteClassification calls DELETE', async () => {
    mockDel.mockResolvedValue(undefined)
    await deleteClassification('id123')
    expect(mockDel).toHaveBeenCalledWith('/product-classification/id123')
  })
})
