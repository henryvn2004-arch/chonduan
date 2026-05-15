'use client'

import { useState, useEffect, useRef } from 'react'
import type { SearchResult } from '@/types/maps'

interface Props {
  onSelect: (result: SearchResult) => void
}

export default function SearchBox({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/projects/search-autocomplete?q=${encodeURIComponent(query)}`)
        const data: SearchResult[] = await res.json()
        setResults(data)
        setOpen(data.length > 0)
      } finally {
        setLoading(false)
      }
    }, 250)
  }, [query])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function select(r: SearchResult) {
    setQuery(r.name_official)
    setOpen(false)
    onSelect(r)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 shadow-sm focus-within:border-[#1565FF] transition-colors">
        <svg className="w-4 h-4 text-[#94A3B8] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          className="flex-1 text-sm text-[#0D1B3D] placeholder-[#94A3B8] bg-transparent outline-none min-w-0"
          placeholder="Tìm dự án, tên chủ đầu tư..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && (
          <div className="w-4 h-4 border-2 border-[#1565FF] border-t-transparent rounded-full animate-spin shrink-0" />
        )}
      </div>

      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden">
          {results.map((r) => (
            <li key={r.id}>
              <button
                className="w-full text-left px-4 py-2.5 hover:bg-[#F1F5F9] transition-colors"
                onMouseDown={() => select(r)}
              >
                <div className="text-sm font-medium text-[#0D1B3D] truncate">{r.name_official}</div>
                <div className="text-xs text-[#94A3B8]">{r.province}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
