import { get, postForm, patchForm, del } from '@/utils/api'
import { API_ROUTES } from '@/utils/api-config'
import type { Product } from '@/types/product'

export interface ProductsResponse {
  products: Product[]
  total: number
  page: number
  limit: number
}

export interface FilterParams {
  category?: string
  province?: string
  municipality?: string
  search?: string
  page?: number
  limit?: number
}

export async function getProducts(filters: FilterParams = {}): Promise<ProductsResponse> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)) })
  const query = params.toString() ? `?${params.toString()}` : ''
  return get<ProductsResponse>(`${API_ROUTES.products}${query}`)
}

export async function getProduct(id: string): Promise<Product> {
  return get<Product>(`${API_ROUTES.products}/${id}`)
}

export async function getMyProducts(): Promise<Product[]> {
  return get<Product[]>(API_ROUTES.myProducts)
}

export async function createProduct(data: FormData): Promise<Product> {
  return postForm<Product>(API_ROUTES.products, data)
}

export async function updateProduct(id: string, data: FormData): Promise<Product> {
  return patchForm<Product>(`${API_ROUTES.products}/${id}`, data)
}

export async function deleteProduct(id: string): Promise<void> {
  return del<void>(`${API_ROUTES.products}/${id}`)
}

export async function removeProductImage(productId: string, publicId: string): Promise<Product> {
  const encodedId = encodeURIComponent(publicId)
  return del<Product>(`${API_ROUTES.products}/${productId}/images/${encodedId}`)
}

export async function getAllProductsAdmin(page = 1, limit = 50): Promise<ProductsResponse> {
  return get<ProductsResponse>(`${API_ROUTES.adminProducts || '/admin/products'}?page=${page}&limit=${limit}`)
}
