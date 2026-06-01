'use client'

import { useState, useRef, useEffect } from 'react'
import { searchClassifications } from '@/services/product-classification-service'
import { CATEGORY_LABELS } from '@/types/product'
import { Search } from 'lucide-react'

interface Props {
  onSelect?: (name: string, category: string) => void
  placeholder?: string
}

interface Suggestion {
  _id: string
  name: string
  category: string
}

export default function ProductClassifier({ onSelect, placeholder = 'Ej: papa, tomate, manzana...' }: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(false)
  const listboxId = 'product-classifier-listbox'
  const inputId = 'product-classifier-input'

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (!val.trim()) {
      setSuggestions([])
      setShowDropdown(false)
      setLoading(false)
    } else {
      setLoading(true)
    }
  }

  useEffect(() => {
    if (!query.trim()) return

    activeRef.current = true

    const timer = setTimeout(async () => {
      try {
        const results = await searchClassifications(query.trim())
        if (activeRef.current) {
          setSuggestions(results)
          setShowDropdown(results.length > 0)
          setSelectedIndex(-1)
        }
      } catch {
        if (activeRef.current) setSuggestions([])
      } finally {
        if (activeRef.current) setLoading(false)
      }
    }, 300)

    return () => {
      activeRef.current = false
      clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (suggestion: Suggestion) => {
    setQuery(suggestion.name)
    setShowDropdown(false)
    onSelect?.(suggestion.name, suggestion.category)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[selectedIndex])
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setShowDropdown(true) }}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={selectedIndex >= 0 ? `${listboxId}-option-${selectedIndex}` : undefined}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2" role="status" aria-label="Buscando...">
            <div className="h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <span className="sr-only">Buscando...</span>
          </div>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          id={listboxId}
          role="listbox"
          aria-label="Sugerencias de productos"
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
        >
          {suggestions.map((s, i) => (
            <button
              key={s._id}
              id={`${listboxId}-option-${i}`}
              role="option"
              aria-selected={i === selectedIndex}
              type="button"
              onClick={() => handleSelect(s)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-green-50 transition-colors ${
                i === selectedIndex ? 'bg-green-50' : ''
              }`}
            >
              <span className="font-medium text-gray-800 capitalize">{s.name}</span>
              <span className="text-xs text-gray-500">
                {CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS] || s.category}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
