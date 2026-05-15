'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { Mode } from '@/types/maps'

const MODES: { value: Mode; label: string; icon: string }[] = [
  { value: 'sale', label: 'Mua / Bán', icon: '🏠' },
  { value: 'rent_long', label: 'Cho thuê', icon: '🔑' },
]

interface Props {
  current: Mode
}

export default function ModeToggle({ current }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function switchMode(mode: Mode) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('mode', mode)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex rounded-xl overflow-hidden border border-[#E2E8F0] bg-white shadow-sm">
      {MODES.map((m) => (
        <button
          key={m.value}
          onClick={() => switchMode(m.value)}
          className={[
            'flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors select-none',
            current === m.value
              ? 'bg-[#1565FF] text-white'
              : 'text-[#64748B] hover:bg-[#F1F5F9]',
          ].join(' ')}
        >
          <span>{m.icon}</span>
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  )
}
