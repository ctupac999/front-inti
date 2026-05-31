'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { updateLegalConsent } from '@/services/user-service'

export default function LegalConsentPage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()

  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [loading, user, router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!acceptedTerms || !acceptedPrivacy) {
      toast.error('Debes aceptar términos y privacidad para continuar')
      return
    }

    setSaving(true)
    try {
      await updateLegalConsent({
        acceptedTerms,
        acceptedPrivacy,
        marketingConsent,
      })
      await refreshUser()
      toast.success('Consentimiento actualizado correctamente')
      router.push('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : 'No se pudo actualizar el consentimiento')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user) return null

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Actualización de consentimiento legal</h1>
      <p className="text-gray-600 mb-8">
        Para seguir usando INTI, necesitamos que confirmes la versión vigente de nuestros documentos legales.
      </p>

      <form onSubmit={onSubmit} className="rounded-2xl border bg-white p-6 space-y-4">
        <label className="flex items-start gap-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span>
            Acepto los{' '}
            <Link href="/legal/terms" target="_blank" className="font-medium text-green-700 hover:underline">
              Términos y Condiciones
            </Link>
            .
          </span>
        </label>

        <label className="flex items-start gap-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={acceptedPrivacy}
            onChange={(e) => setAcceptedPrivacy(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span>
            Acepto la{' '}
            <Link href="/legal/privacy" target="_blank" className="font-medium text-green-700 hover:underline">
              Política de Privacidad y Tratamiento de Datos
            </Link>
            .
          </span>
        </label>

        <label className="flex items-start gap-3 text-sm text-gray-600 pt-2 border-t">
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(e) => setMarketingConsent(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span>(Opcional) Acepto recibir novedades y comunicaciones informativas de INTI.</span>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
        >
          {saving ? 'Guardando...' : 'Confirmar y continuar'}
        </button>
      </form>
    </div>
  )
}
