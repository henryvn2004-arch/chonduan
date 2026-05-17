'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const SLOT_LABEL: Record<string, string> = {
  sale: '🏠 Mua / Bán',
  rent_long: '🔑 Cho thuê dài hạn',
  rent_short: '🏨 Cho thuê ngắn hạn',
}

const FLOOR: Record<string, number> = {
  sale: 100,
  rent_long: 50,
  rent_short: 30,
}

interface Project { id: string; name_official: string; province: string; slug: string }

export default function BidForm({
  specialties,
  walletBalance,
}: {
  specialties: string[]
  walletBalance: number
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [slotType, setSlotType] = useState(specialties[0] ?? 'sale')
  const [amount, setAmount] = useState(FLOOR[specialties[0] ?? 'sale'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const floor = FLOOR[slotType] ?? 100

  useEffect(() => {
    if (!query || selectedProject) { setSuggestions([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/projects/search-autocomplete?q=${encodeURIComponent(query)}&limit=6`)
      if (res.ok) setSuggestions(await res.json())
    }, 250)
  }, [query, selectedProject])

  function selectProject(p: Project) {
    setSelectedProject(p)
    setQuery(p.name_official)
    setSuggestions([])
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!selectedProject) { setError('Chọn dự án trước'); return }
    if (amount < floor) { setError(`Bid tối thiểu ${floor} Cr/tuần`); return }
    if (amount > walletBalance) { setError('Số dư không đủ'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject.id,
          slot_type: slotType,
          bid_amount_weekly_credits: amount,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Lỗi server'); return }
      setSuccess('Bid thành công!')
      setSelectedProject(null)
      setQuery('')
      setAmount(floor)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
      <h2 className="font-semibold text-[#0D1B3D] mb-4">Đặt bid mới</h2>
      <form onSubmit={submit} className="space-y-4">

        {/* Project search */}
        <div className="relative">
          <label className="block text-xs font-medium text-[#64748B] mb-1">Dự án</label>
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedProject(null) }}
            placeholder="Tìm tên dự án..."
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1565FF]"
          />
          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden">
              {suggestions.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectProject(p)}
                  className="w-full text-left px-3 py-2.5 hover:bg-[#F5F7FA] transition-colors"
                >
                  <div className="text-sm font-medium text-[#0D1B3D] truncate">{p.name_official}</div>
                  <div className="text-xs text-[#94A3B8]">{p.province}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Slot type */}
        <div>
          <label className="block text-xs font-medium text-[#64748B] mb-1">Loại slot</label>
          <div className="flex gap-2 flex-wrap">
            {specialties.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => { setSlotType(s); setAmount(FLOOR[s] ?? 30) }}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                  slotType === s
                    ? 'bg-[#1565FF] text-white border-[#1565FF]'
                    : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#1565FF]'
                }`}
              >
                {SLOT_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Bid amount */}
        <div>
          <label className="block text-xs font-medium text-[#64748B] mb-1">
            Số credits / tuần <span className="text-[#94A3B8]">(tối thiểu {floor} Cr)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={amount}
              min={floor}
              onChange={e => setAmount(Number(e.target.value))}
              className="flex-1 border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1565FF]"
            />
            <span className="text-sm text-[#64748B] font-medium shrink-0">Cr/tuần</span>
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-1">
            ≈ {(amount * 1000).toLocaleString('vi-VN')} VND/tuần · Số dư: {walletBalance.toLocaleString()} Cr
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600 font-medium">{success}</p>}

        <button
          type="submit"
          disabled={loading || !selectedProject}
          className="w-full bg-[#1565FF] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#0D4FCC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Đang đặt bid...' : 'Đặt bid'}
        </button>
      </form>
    </div>
  )
}
