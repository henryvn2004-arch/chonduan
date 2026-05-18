'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Suspense, useEffect, useRef, useState } from 'react'
import type { SearchResult, Mode } from '@/types/maps'
import SearchBox from '@/components/map/SearchBox'
import ModeToggle from '@/components/map/ModeToggle'

interface Props {
  mode: Mode
  onSearchSelect?: (result: SearchResult) => void
  onGeolocate?: () => void
}

export default function Nav({ mode, onSearchSelect, onGeolocate }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E2E8F0]">
      <div className="flex items-center gap-3 px-4 h-14">
        {/* Logo */}
        <Link href="/" className="shrink-0 flex items-center gap-2 mr-1">
          <Image src="/logo.png" alt="PhaplyDuan" width={140} height={40} className="h-9 w-auto hidden sm:block" priority />
          <Image src="/favicon.png" alt="PhaplyDuan" width={36} height={36} className="h-9 w-auto sm:hidden" priority />
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-xl">
          <Suspense>
            <SearchBox onSelect={onSearchSelect ?? (() => {})} />
          </Suspense>
        </div>

        {/* Location button */}
        <button
          onClick={onGeolocate}
          className="hidden md:flex items-center gap-1.5 text-sm font-medium text-[#1565FF] hover:text-[#0D4FCC] shrink-0 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Vị trí của tôi</span>
        </button>

        {/* Mode toggle */}
        <div className="hidden lg:block shrink-0">
          <Suspense>
            <ModeToggle current={mode} />
          </Suspense>
        </div>

        {/* Favorites */}
        <button className="hidden md:flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#0D1B3D] shrink-0 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>Yêu thích</span>
        </button>

        {/* Hamburger + dropdown */}
        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Mở menu"
            aria-expanded={menuOpen}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] transition-colors text-[#64748B]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-lg border border-[#E2E8F0] py-2 z-50">
              <Link
                href="/dang-nhap"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-[#0D1B3D] hover:bg-[#F1F5F9]"
              >
                Đăng nhập
              </Link>
              <Link
                href="/dang-ky/moi-gioi"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-[#0D1B3D] hover:bg-[#F1F5F9]"
              >
                Đăng ký môi giới
              </Link>
              <div className="my-1.5 border-t border-[#E2E8F0]" />
              <Link
                href="/dashboard/moi-gioi"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0D1B3D]"
              >
                Dashboard môi giới
              </Link>
              <Link
                href="/dashboard/admin"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0D1B3D]"
              >
                Dashboard admin
              </Link>
              {/* Mobile-only items duplicated from nav (hidden on md+) */}
              <div className="md:hidden">
                <div className="my-1.5 border-t border-[#E2E8F0]" />
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    onGeolocate?.()
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#1565FF] hover:bg-[#F1F5F9]"
                >
                  Vị trí của tôi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
