import type { ProductCategory } from './product'

export interface ProductClassification {
  _id: string
  name: string
  category: ProductCategory
  aliases: string[]
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface SearchResult {
  _id: string
  name: string
  category: ProductCategory
  aliases: string[]
}
