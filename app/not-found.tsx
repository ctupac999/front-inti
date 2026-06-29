import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-6xl font-bold text-green-700">404</h1>
      <p className="text-xl text-gray-600 text-center">
        Página no encontrada
      </p>
      <Link
        href="/"
        className="mt-4 rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700 transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
