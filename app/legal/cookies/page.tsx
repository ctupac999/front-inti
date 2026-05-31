'use client'

import { useLanguage } from '@/contexts/language-context'

export default function CookiesPage() {
  const { t } = useLanguage()
  const legalVersion = t('legal.version')
  return (
    <main className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('legal.cookies.title')}</h1>
      <p className="text-sm text-gray-500 mb-8">{legalVersion} — {t('legal.lastUpdate')}: 19/05/2026</p>

      <div className="space-y-6 text-gray-700 leading-7">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. ¿Qué son las cookies?</h2>
          <p>
            Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo para permitir el funcionamiento
            técnico del sitio y recordar tus preferencias.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Tipos de cookies usadas por INTI</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Necesarias:</strong> imprescindibles para autenticación, seguridad y funcionamiento básico de la
              plataforma.
            </li>
            <li>
              <strong>Analíticas (opcionales):</strong> permiten medir uso y rendimiento para mejorar la experiencia.
            </li>
            <li>
              <strong>Marketing (opcionales):</strong> usadas para comunicaciones o campañas cuando exista consentimiento.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Base legal</h2>
          <p>
            Las cookies necesarias se usan por interés legítimo técnico del servicio. Las cookies analíticas y de marketing
            solo se habilitan con tu consentimiento.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Gestión del consentimiento</h2>
          <p>
            Podés aceptar todas, rechazar las opcionales o configurar tus preferencias desde el banner de cookies. También
            podés eliminar cookies desde la configuración de tu navegador.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Cambios de política</h2>
          <p>
            Esta política puede actualizarse para reflejar cambios legales o técnicos. La versión vigente será siempre la
            publicada en esta página.
          </p>
        </section>
      </div>
    </main>
  )
}
