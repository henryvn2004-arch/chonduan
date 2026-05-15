'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import type { SearchResult, Mode } from '@/types/maps'
import SearchBox from '@/components/map/SearchBox'
import ModeToggle from '@/components/map/ModeToggle'

interface Props {
  mode: Mode
  onSearchSelect?: (result: SearchResult) => void
}

export default function Nav({ mode, onSearchSelect }: Props) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E2E8F0] shadow-sm">
      <div className="flex items-center gap-3 px-4 py-2.5 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link href="/" className="shrink-0 flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1565FF] rounded-lg flex items-center justify-center text-white font-bold text-sm">C</div>
          <span className="font-bold text-[#0D1B3D] text-base hidden sm:block tracking-tight">ChonDuAn</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <Suspense>
            <SearchBox onSelect={onSearchSelect ?? (() => {})} />
          </Suspense>
        </div>

        {/* Mode toggle */}
        <Suspense>
          <ModeToggle current={mode} />
        </Suspense>

        {/* Auth actions */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <Link
            href="/dang-nhap"
            className="text-sm font-medium text-[#64748B] hover:text-[#0D1B3D] transition-colors hidden sm:block"
          >
            Đăng nhập
          </Link>
          <Link
            href="/dang-nhap?tab=register"
            className="text-sm font-medium bg-[#1565FF] text-white px-3 py-1.5 rounded-lg hover:bg-[#0D4FCC] transition-colors"
          >
            Đăng ký
          </Link>
        </div>
      </div>
    </header>
  )
}
