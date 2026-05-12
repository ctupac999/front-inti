import { create } from 'zustand'
import type { SiteConfig } from '@/types/site-config'

interface SiteConfigStore {
  config: SiteConfig | null
  setConfig: (config: SiteConfig) => void
}

export const useSiteConfigStore = create<SiteConfigStore>((set) => ({
  config: null,
  setConfig: (config) => set({ config }),
}))
