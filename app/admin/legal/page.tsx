'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { getSiteConfig, updateSiteConfig } from '@/services/site-config-service'
import { getLegalVersion } from '@/services/legal-service'
import type { SiteConfig } from '@/types/site-config'
import { toast } from 'sonner'
import { Save, Scale, ExternalLink } from 'lucide-react'

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export default function AdminLegalPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  const [config, setConfig] = useState<SiteConfig | null>(null)
  const [backendVersion, setBackendVersion] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.push('/')
  }, [user, loading, isAdmin, router])

  useEffect(() => {
    if (!isAdmin) return
    Promise.all([getSiteConfig(), getLegalVersion()])
      .then(([cfg, legal]) => {
        setConfig(cfg)
        setBackendVersion(legal.legalVersion)
      })
      .catch(() => toast.error('No se pudo cargar la configuración legal'))
  }, [isAdmin])

  const handleSave = async () => {
    if (!config) return
    if (!config.legalVersion?.trim()) {
      toast.error('La versión legal no puede quedar vacía')
      return
    }
    setSaving(true)
    try {
      const updated = await updateSiteConfig({ legalVersion: config.legalVersion.trim() })
      setConfig(updated)
      setBackendVersion(updated.legalVersion)
      toast.success('Versión legal actualizada')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Error al guardar versión legal'))
    } finally {
      setSaving(false)
    }
  }

  if (loading || !config || !user || !isAdmin) return null

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-green-100 p-2">
            <Scale className="h-6 w-6 text-green-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Legal Management</h1>
            <p className="text-sm text-gray-500">Control de versión legal y re-consentimiento</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">Versión legal vigente</h2>
          <label className="mb-1 block text-sm font-medium text-gray-700">LEGAL_VERSION</label>
          <input
            value={config.legalVersion || ''}
            onChange={(e) => setConfig((prev) => (prev ? { ...prev, legalVersion: e.target.value } : prev))}
            placeholder="v1.0"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
          <p className="mt-2 text-xs text-gray-500">
            Al cambiar esta versión, los usuarios deberán aceptar nuevamente los documentos legales al iniciar sesión.
          </p>
          <p className="mt-3 text-xs text-gray-500">
            Versión detectada por backend: <span className="font-semibold text-gray-700">{backendVersion || '—'}</span>
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">Documentos legales públicos</h2>
          <div className="space-y-3 text-sm">
            <Link href="/legal/terms" target="_blank" className="flex items-center gap-2 text-green-700 hover:underline">
              Términos y Condiciones <ExternalLink className="h-4 w-4" />
            </Link>
            <Link href="/legal/privacy" target="_blank" className="flex items-center gap-2 text-green-700 hover:underline">
              Política de Privacidad <ExternalLink className="h-4 w-4" />
            </Link>
            <Link href="/legal/cookies" target="_blank" className="flex items-center gap-2 text-green-700 hover:underline">
              Política de Cookies <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
