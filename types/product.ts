export type ProductCategory =
  | 'frutas'
  | 'verduras'
  | 'granos'
  | 'lacteos'
  | 'carnes'
  | 'huevos'
  | 'plantas'
  | 'semillas'
  | 'conservas'
  | 'artesanias'
  | 'herramientas'
  | 'otros'

export type ProductStatus = 'available' | 'reserved' | 'traded' | 'inactive'

export interface ProductImage {
  url: string
  publicId: string
  objectPosition?: string
}

export interface Product {
  _id: string
  title: string
  description: string
  category: ProductCategory
  quantity: number
  unit: string
  images: ProductImage[]
  owner: {
    _id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  location: {
    name: string
    country?: string
    province: string
    municipality: string
    postalCode?: string
  }
  status: ProductStatus
  lookingFor: string[]
  isOrganic: boolean
  harvestDate?: string
  views: number
  createdAt: string
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  frutas: '🍎 Frutas',
  verduras: '🥦 Verduras',
  granos: '🌾 Granos',
  lacteos: '🥛 Lácteos',
  carnes: '🥩 Carnes',
  huevos: '🥚 Huevos',
  plantas: '🌱 Plantas',
  semillas: '🌰 Semillas',
  conservas: '🫙 Conservas',
  artesanias: '🧺 Artesanías',
  herramientas: '🔧 Herramientas',
  otros: '📦 Otros',
}

export const UNIT_OPTIONS = [
  'kg', 'gr', 'litros', 'ml', 'docena', 'unidades',
  'atado', 'cajón', 'bolsa', 'canasto',
]
