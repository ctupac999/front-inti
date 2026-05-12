export interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: 'user' | 'admin'
  locations: Location[]
  avatar?: string
  bio?: string
  isActive: boolean
  createdAt: string
}

export interface Location {
  name: string
  province: string
  municipality: string
  address?: string
  coordinates?: { lat: number; lng: number }
}

export interface AuthResponse {
  user: User
  token: string
}
