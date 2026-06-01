'use client'

import { useState } from 'react'
import ProductClassifier from '@/components/products/ProductClassifier'
import { CATEGORY_LABELS } from '@/types/product'
import { Search, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function ClasificadorPage() {
  const [selected, setSelected] = useState<{ name: string; category: string } | null>(null)

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 mb-4">
          <Search className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Clasificador de productos</h1>
        <p className="text-gray-500 mt-2">
          Buscá un producto y te decimos a qué categoría pertenece
        </p>
      </div>

      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <ProductClassifier
          onSelect={(name, category) => setSelected({ name, category })}
          placeholder="Ej: papa, tomate, manzana, trigo..."
        />

        {selected && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Producto</p>
                <p className="text-xl font-bold text-gray-900 capitalize">{selected.name}</p>
              </div>
              <ArrowRight className="h-6 w-6 text-green-400" />
              <div className="text-right">
                <p className="text-sm text-gray-500">Categoría</p>
                <p className="text-xl font-bold text-green-700">
                  {CATEGORY_LABELS[selected.category as keyof typeof CATEGORY_LABELS] || selected.category}
                </p>
              </div>
            </div>
          </div>
        )}

        {!selected && (
          <div className="mt-6 text-center text-sm text-gray-400">
            <p>Escribí el nombre de un producto para ver su clasificación</p>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 mb-3">¿No encontrás tu producto o creés que falta?</p>
        <Link
          href="/admin/product-classification"
          className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
        >
          Sugerilo al administrador
        </Link>
      </div>
    </div>
  )
}
