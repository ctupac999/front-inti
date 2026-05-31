import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGet = vi.fn()
const mockPostForm = vi.fn()
const mockPatchForm = vi.fn()
const mockDel = vi.fn()
vi.mock('@/utils/api', () => ({
  get: mockGet,
  postForm: mockPostForm,
  patchForm: mockPatchForm,
  del: mockDel,
}))

const { getProducts, getProduct, getMyProducts, createProduct, updateProduct, deleteProduct, removeProductImage } = await import('./product-service')

beforeEach(() => {
  mockGet.mockReset()
  mockPostForm.mockReset()
  mockPatchForm.mockReset()
  mockDel.mockReset()
})

const mockProduct = {
  _id: 'p1',
  title: 'Manzanas',
  description: 'Rojas',
  category: 'frutas' as const,
  quantity: 10,
  unit: 'kg',
  images: [],
  owner: { _id: 'u1', firstName: 'Juan', lastName: 'Pérez' },
  location: { name: 'Finca', province: 'Córdoba', municipality: 'Colón' },
  status: 'available' as const,
  lookingFor: ['verduras'],
  isOrganic: true,
  views: 0,
  createdAt: '2024-01-01T00:00:00Z',
}

describe('getProducts', () => {
  it('calls GET /products with query params', async () => {
    mockGet.mockResolvedValue({ products: [mockProduct], total: 1, page: 1, limit: 20 })
    const result = await getProducts({ category: 'frutas', page: 1 })
    expect(mockGet).toHaveBeenCalledWith('/products?category=frutas&page=1')
    expect(result.products).toHaveLength(1)
  })

  it('omits empty filters', async () => {
    mockGet.mockResolvedValue({ products: [], total: 0, page: 1, limit: 20 })
    await getProducts({})
    expect(mockGet).toHaveBeenCalledWith('/products')
  })
})

describe('getProduct', () => {
  it('calls GET /products/:id', async () => {
    mockGet.mockResolvedValue(mockProduct)
    const result = await getProduct('p1')
    expect(mockGet).toHaveBeenCalledWith('/products/p1')
    expect(result._id).toBe('p1')
  })
})

describe('getMyProducts', () => {
  it('calls GET /products/user/mine', async () => {
    mockGet.mockResolvedValue([mockProduct])
    const result = await getMyProducts()
    expect(mockGet).toHaveBeenCalledWith('/products/user/mine')
    expect(result).toHaveLength(1)
  })
})

describe('createProduct', () => {
  it('sends FormData to POST /products', async () => {
    mockPostForm.mockResolvedValue(mockProduct)
    const form = new FormData()
    form.append('title', 'Manzanas')
    const result = await createProduct(form)
    expect(mockPostForm).toHaveBeenCalledWith('/products', form)
    expect(result._id).toBe('p1')
  })
})

describe('updateProduct', () => {
  it('sends FormData to PATCH /products/:id', async () => {
    mockPatchForm.mockResolvedValue({ ...mockProduct, title: 'Manzanas Verdes' })
    const form = new FormData()
    form.append('title', 'Manzanas Verdes')
    const result = await updateProduct('p1', form)
    expect(mockPatchForm).toHaveBeenCalledWith('/products/p1', form)
    expect(result.title).toBe('Manzanas Verdes')
  })
})

describe('deleteProduct', () => {
  it('calls DELETE /products/:id', async () => {
    mockDel.mockResolvedValue(undefined)
    await deleteProduct('p1')
    expect(mockDel).toHaveBeenCalledWith('/products/p1')
  })
})

describe('removeProductImage', () => {
  it('calls DELETE /products/:id/images/:publicId', async () => {
    mockDel.mockResolvedValue(mockProduct)
    const result = await removeProductImage('p1', 'img/123')
    expect(mockDel).toHaveBeenCalledWith('/products/p1/images/img%2F123')
    expect(result).toEqual(mockProduct)
  })
})
