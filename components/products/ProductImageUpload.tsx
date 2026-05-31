'use client'

import { useEffect, useState } from 'react'
import { Upload, X, Move } from 'lucide-react'
import Image from 'next/image'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ImageEntry {
  file: File
  url: string
  objectPosition: string
}

interface Props {
  /** Max number of new images (not counting existing ones). Default: 5. */
  maxImages?: number
  onChange: (entries: ImageEntry[]) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatPositionLabel = (pos: string) => {
  const map: Record<string, string> = {
    'center center': 'Centro',
    'center top': 'Arriba',
    'center bottom': 'Abajo',
    'left center': 'Izquierda',
    'right center': 'Derecha',
    'left top': 'Arriba izq.',
    'right top': 'Arriba der.',
    'left bottom': 'Abajo izq.',
    'right bottom': 'Abajo der.',
  }
  return map[pos] ?? pos
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProductImageUpload({ maxImages = 5, onChange }: Props) {
  const [entries, setEntries] = useState<ImageEntry[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  // Notify parent on change
  useEffect(() => {
    onChange(entries)
  }, [entries]) // eslint-disable-line react-hooks/exhaustive-deps

  // Revoke blob URLs on unmount
  useEffect(() => {
    return () => entries.forEach((e) => URL.revokeObjectURL(e.url))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── File selection ─────────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || [])
    e.target.value = '' // allow re-selecting same file

    const valid = incoming.filter((f) => f.type.startsWith('image/'))
    if (!valid.length) return

    const slots = maxImages - entries.length
    const toAdd = valid.slice(0, slots)

    const newEntries: ImageEntry[] = toAdd.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      objectPosition: 'center center',
    }))

    setEntries((prev) => {
      const next = [...prev, ...newEntries]
      // Auto-select the first newly added image
      setSelectedIdx(prev.length)
      return next
    })
  }

  // ── Remove ─────────────────────────────────────────────────────────────────

  const remove = (idx: number) => {
    setEntries((prev) => {
      URL.revokeObjectURL(prev[idx].url)
      const next = prev.filter((_, i) => i !== idx)
      return next
    })
    setSelectedIdx((prev) => {
      if (prev === null) return null
      if (prev === idx) return null
      if (prev > idx) return prev - 1
      return prev
    })
  }

  // ── Drag-to-position ───────────────────────────────────────────────────────

  const startDrag = (
    event: React.PointerEvent<HTMLDivElement>,
    idx: number,
  ) => {
    event.preventDefault()
    const target = event.currentTarget as HTMLDivElement
    const rect = target.getBoundingClientRect()

    const updatePosition = (clientX: number, clientY: number) => {
      const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
      const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100))
      const pos = `${x.toFixed(1)}% ${y.toFixed(1)}%`
      setEntries((prev) =>
        prev.map((e, i) => (i === idx ? { ...e, objectPosition: pos } : e)),
      )
    }

    updatePosition(event.clientX, event.clientY)

    const onMove = (e: PointerEvent) => updatePosition(e.clientX, e.clientY)
    const stop = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const selected = selectedIdx !== null ? entries[selectedIdx] ?? null : null
  const canAdd = entries.length < maxImages

  return (
    <div className="space-y-4">
      {/* ── Big preview for selected image ─────────────────────────────────── */}
      {selected && selectedIdx !== null && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-4">
            {/* Drag area */}
            <div
              className="relative flex-shrink-0 overflow-hidden rounded-lg border-2 border-green-400 cursor-grab active:cursor-grabbing select-none"
              style={{ width: 200, height: 200, touchAction: 'none' }}
              onPointerDown={(e) => startDrag(e, selectedIdx)}
              title="Arrastrá para ajustar el encuadre"
            >
              {/* Overflow trick from Sara: scale image bigger to allow visible panning */}
              <Image
                src={selected.url}
                alt={selected.file.name}
                draggable={false}
                fill
                className="object-cover pointer-events-none select-none"
                style={{
                  objectPosition: selected.objectPosition,
                  transform: 'scale(1.2)',
                  transformOrigin: selected.objectPosition,
                }}
              />
              {/* Crosshair indicator */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-6 h-6 rounded-full border-2 border-white/80 bg-black/20 flex items-center justify-center">
                  <Move className="h-3 w-3 text-white" />
                </div>
              </div>
              <span className="absolute bottom-2 left-2 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-semibold text-white pointer-events-none">
                Arrastrá para encuadrar
              </span>
            </div>

            {/* Info panel */}
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-sm font-semibold text-gray-800 truncate">{selected.file.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(selected.file.size)}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="font-medium">Encuadre:</span>
                <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                  {formatPositionLabel(selected.objectPosition)}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                La vista de arriba muestra exactamente cómo se verá la imagen recortada en las cards del marketplace. Arrastrá para centrar tu producto.
              </p>
              <button
                type="button"
                onClick={() => setSelectedIdx(null)}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Cerrar vista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Thumbnail grid ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        {entries.map((entry, idx) => (
          <button
            key={`${entry.file.name}-${entry.file.lastModified}`}
            type="button"
            onClick={() => setSelectedIdx(idx === selectedIdx ? null : idx)}
            className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all focus:outline-none ${
              idx === selectedIdx
                ? 'border-green-500 ring-2 ring-green-200'
                : 'border-gray-200 hover:border-green-300'
            }`}
            title="Clic para editar encuadre"
          >
            <Image
              src={entry.url}
              alt={entry.file.name}
              fill
              className="object-cover pointer-events-none"
              style={{ objectPosition: entry.objectPosition }}
            />
            {/* Remove button */}
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => { e.stopPropagation(); remove(idx) }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); remove(idx) } }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center z-10 hover:bg-red-600"
              aria-label={`Eliminar imagen ${idx + 1}`}
            >
              <X className="h-3 w-3" />
            </span>
            {/* Selected indicator */}
            {idx === selectedIdx && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-green-400 pointer-events-none" />
            )}
          </button>
        ))}

        {/* Add button */}
        {canAdd && (
          <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors gap-1">
            <Upload className="h-5 w-5 text-gray-400" />
            <span className="text-[10px] text-gray-400">{entries.length}/{maxImages}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* ── Hint ───────────────────────────────────────────────────────────── */}
      {entries.length > 0 && (
        <p className="text-xs text-gray-400">
          Tocá una imagen para ajustar el encuadre arrastrando.{' '}
          {entries.length === maxImages && 'Límite de fotos alcanzado.'}
        </p>
      )}
    </div>
  )
}
