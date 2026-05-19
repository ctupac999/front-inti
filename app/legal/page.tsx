import Link from 'next/link'

export default function LegalIndexPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Información legal</h1>
      <p className="text-gray-600 mb-8">
        En esta sección encontrarás los documentos legales aplicables al uso de INTI.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/legal/terms"
          className="rounded-2xl border bg-white p-6 hover:border-green-300 hover:shadow-sm transition-all"
        >
          <h2 className="font-semibold text-gray-900">Términos y Condiciones</h2>
          <p className="text-sm text-gray-600 mt-2">
            Reglas de uso de la plataforma, responsabilidades y límites de INTI.
          </p>
        </Link>

        <Link
          href="/legal/privacy"
          className="rounded-2xl border bg-white p-6 hover:border-green-300 hover:shadow-sm transition-all"
        >
          <h2 className="font-semibold text-gray-900">Política de Privacidad</h2>
          <p className="text-sm text-gray-600 mt-2">
            Tratamiento de datos personales, finalidades, base legal y derechos del usuario.
          </p>
        </Link>
      </div>
    </div>
  )
}
