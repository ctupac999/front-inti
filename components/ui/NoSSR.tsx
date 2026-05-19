'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

/**
 * Wrapper que deshabilita SSR para evitar hydration mismatches
 * causados por extensiones del navegador (Honey, bancos, etc.)
 * que inyectan atributos como bis_skin_checked en el DOM.
 */
export default function NoSSR({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
