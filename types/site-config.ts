export interface SiteConfig {
  siteName: string
  siteSlogan: string
  contactEmail: string
  contactPhone: string
  logo: { url: string; publicId: string }
  primaryColor: string
  secondaryColor: string
  facebookUrl: string
  instagramUrl: string
  whatsappNumber: string
  aboutText: string
  allowRegistrations: boolean
  enabledCountries: string[]
  legalVersion: string
}
