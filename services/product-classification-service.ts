import { get, post, patch, del } from '@/utils/api'
import { API_ROUTES } from '@/utils/api-config'
import type { ProductClassification } from '@/types/product-classification'

export async function searchClassifications(query: string): Promise<ProductClassification[]> {
  return get<ProductClassification[]>(`${API_ROUTES.productClassification}/search?q=${encodeURIComponent(query)}`)
}

export async function getAllClassifications(page = 1, limit = 50): Promise<{ data: ProductClassification[]; total: number }> {
  return get<{ data: ProductClassification[]; total: number }>(
    `${API_ROUTES.productClassification}?page=${page}&limit=${limit}`,
  )
}

export async function createClassification(data: { name: string; category: string; aliases?: string[] }): Promise<ProductClassification> {
  return post<ProductClassification>(API_ROUTES.productClassification, data)
}

export async function updateClassification(id: string, data: Partial<{ name: string; category: string; aliases: string[]; active: boolean }>): Promise<ProductClassification> {
  return patch<ProductClassification>(`${API_ROUTES.productClassification}/${id}`, data)
}

export async function deleteClassification(id: string): Promise<void> {
  return del<void>(`${API_ROUTES.productClassification}/${id}`)
}
