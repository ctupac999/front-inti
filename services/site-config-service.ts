import { get, patch, postForm } from '@/utils/api'
import { API_ROUTES } from '@/utils/api-config'
import type { SiteConfig } from '@/types/site-config'

export async function getSiteConfig(): Promise<SiteConfig> {
  return get<SiteConfig>(API_ROUTES.siteConfig)
}

export async function updateSiteConfig(data: Partial<SiteConfig>): Promise<SiteConfig> {
  return patch<SiteConfig>(API_ROUTES.siteConfig, data)
}

export async function uploadLogo(file: File): Promise<SiteConfig> {
  const form = new FormData()
  form.append('file', file)
  return postForm<SiteConfig>(`${API_ROUTES.siteConfig}/logo`, form)
}
