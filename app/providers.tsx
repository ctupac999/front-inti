'use client'

import { useEffect } from 'react'
import { AuthProvider } from '@/contexts/auth-context'
import { LanguageProvider } from '@/contexts/language-context'
import { SocketProvider } from '@/contexts/socket-context'
import { useSiteConfigStore } from '@/stores/site-config-store'
import { getSiteConfig } from '@/services/site-config-service'
import { Toaster } from '@/components/ui/sonner'
import LegalConsentGuard from '@/components/legal/LegalConsentGuard'
import CookieConsentBanner from '@/components/legal/CookieConsentBanner'

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    getSiteConfig()
      .then((cfg) => useSiteConfigStore.getState().setConfig(cfg))
      .catch(() => null)
  }, [])

  return (
    <LanguageProvider>
      <AuthProvider>
        <SocketProvider>
          <LegalConsentGuard />
          {children}
          <Toaster richColors position="top-right" />
          <CookieConsentBanner />
        </SocketProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}
