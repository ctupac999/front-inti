'use client'

import { useEffect } from 'react'
import { AuthProvider } from '@/contexts/auth-context'
import { LanguageProvider } from '@/contexts/language-context'
import { useSiteConfigStore } from '@/stores/site-config-store'
import { getSiteConfig } from '@/services/site-config-service'
import { Toaster } from '@/components/ui/sonner'

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    getSiteConfig()
      .then((cfg) => useSiteConfigStore.getState().setConfig(cfg))
      .catch(() => null)
  }, [])

  return (
    <LanguageProvider>
      <AuthProvider>
        {children}
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </LanguageProvider>
  )
}
