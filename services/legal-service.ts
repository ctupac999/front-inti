import { get } from '@/utils/api'
import { API_ROUTES } from '@/utils/api-config'

export interface LegalVersionResponse {
  legalVersion: string
  termsUrl: string
  privacyUrl: string
  consentUrl: string
  updatedAt: string
}

export async function getLegalVersion(): Promise<LegalVersionResponse> {
  return get<LegalVersionResponse>(API_ROUTES.legalVersion)
}
