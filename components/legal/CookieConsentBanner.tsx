'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

type CookieConsent = {
  necessary: true
  analytics: boolean
  marketing: boolean
  updatedAt: string
}

const STORAGE_KEY = 'inti_cookie_consent_v1'

function readConsent(): { visible: boolean; analytics: boolean; marketing: boolean } {
  if (typeof window === 'undefined') return { visible: false, analytics: false, marketing: false }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { visible: true, analytics: false, marketing: false }
  try {
    const parsed = JSON.parse(raw) as CookieConsent
    return { visible: false, analytics: !!parsed.analytics, marketing: !!parsed.marketing }
  } catch {
    return { visible: true, analytics: false, marketing: false }
  }
}

function saveConsent(consent: CookieConsent) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
  document.cookie = `inti_cookie_consent=${encodeURIComponent(JSON.stringify(consent))}; path=/; max-age=${60 * 60 * 24 * 365}`
}

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => readConsent().visible)
  const [configOpen, setConfigOpen] = useState(false)
  const [analytics, setAnalytics] = useState(() => readConsent().analytics)
  const [marketing, setMarketing] = useState(() => readConsent().marketing)

  const summary = useMemo(() => {
    if (!analytics && !marketing) return 'Solo necesarias'
    if (analytics && marketing) return 'Todas aceptadas'
    if (analytics) return 'Necesarias + analíticas'
    return 'Necesarias + marketing'
  }, [analytics, marketing])

  const acceptNecessary = () => {
    saveConsent({ necessary: true, analytics: false, marketing: false, updatedAt: new Date().toISOString() })
    setVisible(false)
    setConfigOpen(false)
  }

  const acceptAll = () => {
    saveConsent({ necessary: true, analytics: true, marketing: true, updatedAt: new Date().toISOString() })
    setVisible(false)
    setConfigOpen(false)
  }

  const saveCustom = () => {
    saveConsent({ necessary: true, analytics, marketing, updatedAt: new Date().toISOString() })
    setVisible(false)
    setConfigOpen(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 rounded-2xl border bg-white p-4 shadow-xl">
      <div className="flex flex-col gap-3">
        <div>
          <p className="font-semibold text-gray-900">Uso de cookies</p>
          <p className="text-sm text-gray-600">
            Usamos cookies necesarias para que la plataforma funcione y, si lo autorizás, cookies analíticas o de marketing.
            Más detalles en nuestra{' '}
            <Link href="/legal/cookies" className="text-green-700 hover:underline">
              Política de Cookies
            </Link>
            .
          </p>
          {!configOpen && (
            <p className="text-xs text-gray-500 mt-1">Estado actual: {summary}</p>
          )}
        </div>

        {configOpen && (
          <div className="rounded-xl border bg-gray-50 p-3 text-sm space-y-2">
            <label className="flex items-center gap-2 text-gray-700">
              <input type="checkbox" checked disabled className="h-4 w-4" />
              Cookies necesarias (siempre activas)
            </label>
            <label className="flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="h-4 w-4"
              />
              Cookies analíticas
            </label>
            <label className="flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="h-4 w-4"
              />
              Cookies de marketing
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {!configOpen ? (
            <button
              onClick={() => setConfigOpen(true)}
              className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Configurar
            </button>
          ) : (
            <button
              onClick={saveCustom}
              className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Guardar configuración
            </button>
          )}
          <button
            onClick={acceptNecessary}
            className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Solo necesarias
          </button>
          <button
            onClick={acceptAll}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
          >
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  )
}
