'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Home, Key } from 'lucide-react'
import type { Mode } from '@/types/maps'

const MODES: { value: Mode; label: string; Icon: React.ElementType }[] = [
  { value: 'sale', label: 'Mua / Bán', Icon: Home },
  { value: 'rent_long', label: 'Cho thuê', Icon: Key },
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
    <div className="flex rounded-full overflow-hidden border border-[#E2E8F0] bg-white shadow-sm p-0.5 gap-0.5">
      {MODES.map((m) => (
        <button
          key={m.value}
          onClick={() => switchMode(m.value)}
          className={[
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all select-none',
            current === m.value
              ? 'bg-[#1565FF] text-white shadow-sm'
              : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0D1B3D]',
          ].join(' ')}
        >
          <m.Icon className="w-3.5 h-3.5" strokeWidth={2} />
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  )
}
