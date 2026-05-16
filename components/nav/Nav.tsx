'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import type { SearchResult, Mode } from '@/types/maps'
import SearchBox from '@/components/map/SearchBox'
import ModeToggle from '@/components/map/ModeToggle'

interface Props {
  mode: Mode
  onSearchSelect?: (result: SearchResult) => void
  onGeolocate?: () => void
}

export default function Nav({ mode, onSearchSelect, onGeolocate }: Props) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E2E8F0]">
      <div className="flex items-center gap-3 px-4 h-14">
        {/* Logo */}
        <Link href="/" className="shrink-0 flex items-center gap-2 mr-1">
          <Image src="/logo.png" alt="ChonDuAn" width={140} height={40} className="h-9 w-auto hidden sm:block" priority />
          <Image src="/favicon.png" alt="ChonDuAn" width={36} height={36} className="h-9 w-auto sm:hidden" priority />
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

        {/* Hamburger */}
        <button className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] transition-colors text-[#64748B]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  )
}
