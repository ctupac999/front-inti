'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error de página:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-6xl font-bold text-red-600">!</h1>
      <p className="text-xl text-gray-600 text-center">
        Algo salió mal. Intentalo de nuevo.
      </p>
      <div className="flex gap-4 mt-4">
        <button
          onClick={reset}
          className="rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700 transition-colors"
        >
          Intentar de nuevo
        </button>
        <Link
          href="/"
          className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
