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
  acceptedTermsAt?: string
  acceptedPrivacyAt?: string
  legalVersion?: string
  marketingConsent?: boolean
  acceptedLegalIp?: string
  acceptedLegalUserAgent?: string
  createdAt: string
}

export interface Location {
  name: string
  country?: string
  province: string
  municipality: string
  community?: string
  address?: string
  coordinates?: { lat: number; lng: number }
}

export interface AuthResponse {
  user: User
  token: string
}
