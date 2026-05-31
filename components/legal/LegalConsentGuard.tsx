'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { getLegalVersion } from '@/services/legal-service'

const PUBLIC_PREFIXES = ['/auth', '/legal']

export default function LegalConsentGuard() {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [requiredVersion, setRequiredVersion] = useState<string | null>(null)

  useEffect(() => {
    getLegalVersion()
      .then((res) => setRequiredVersion(res.legalVersion))
      .catch(() => null)
  }, [])

  const isPublicPath = useMemo(
    () => PUBLIC_PREFIXES.some((prefix) => pathname?.startsWith(prefix)),
    [pathname],
  )

  useEffect(() => {
    if (loading || !user || !requiredVersion || isPublicPath) return

    const missingConsent = !user.acceptedTermsAt || !user.acceptedPrivacyAt
    const outdatedConsent = user.legalVersion !== requiredVersion

    if (missingConsent || outdatedConsent) {
      router.replace('/legal/consent')
    }
  }, [loading, user, requiredVersion, isPublicPath, router])

  return null
}
