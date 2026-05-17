'use client'

import { useState } from 'react'
import { Landmark, CreditCard } from 'lucide-react'

interface Package {
  id: string
  name: string
  credits: number
  bonus_credits: number
  price_vnd: number
}

export default function TopupForm({ packages }: { packages: Package[] }) {
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null)
  const [method, setMethod] = useState<'paypal' | 'payos'>('payos')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!selectedPkg) { setError('Chọn gói trước'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: selectedPkg.id, method }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Lỗi server'); return }
      window.location.href = data.redirect_url
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Packages */}
      <div>
        <p className="text-sm font-medium text-[#0D1B3D] mb-3">Chọn gói credits</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {packages.map(pkg => {
            const total = pkg.credits + pkg.bonus_credits
            const isSelected = selectedPkg?.id === pkg.id
            return (
              <button
                key={pkg.id}
                onClick={() => setSelectedPkg(pkg)}
                className={`text-left p-4 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'border-[#1565FF] bg-[#EFF6FF]'
                    : 'border-[#E2E8F0] bg-white hover:border-[#93C5FD]'
                }`}
              >
                <div className="font-semibold text-[#0D1B3D] text-sm mb-1">{pkg.name}</div>
                <div className="text-2xl font-bold text-[#1565FF]">
                  {total.toLocaleString()}
                  <span className="text-sm font-normal text-[#64748B] ml-1">Cr</span>
                </div>
                {pkg.bonus_credits > 0 && (
                  <div className="text-[11px] text-green-600 font-medium mt-0.5">
                    +{pkg.bonus_credits} bonus included
                  </div>
                )}
                <div className="text-xs text-[#64748B] mt-2">
                  {pkg.price_vnd.toLocaleString('vi-VN')} VND
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-0.5">
                  ≈ {Math.round(pkg.price_vnd / total).toLocaleString('vi-VN')} VND/Cr
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Payment method */}
      <div>
        <p className="text-sm font-medium text-[#0D1B3D] mb-3">Phương thức thanh toán</p>
        <div className="flex gap-3">
          <button
            onClick={() => setMethod('payos')}
            className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
              method === 'payos'
                ? 'border-[#1565FF] bg-[#EFF6FF] text-[#1565FF]'
                : 'border-[#E2E8F0] text-[#64748B] hover:border-[#93C5FD]'
            }`}
          >
            <Landmark className="w-4 h-4 inline mr-1.5" strokeWidth={2} />payOS (Banking / QR)
          </button>
          <button
            onClick={() => setMethod('paypal')}
            className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
              method === 'paypal'
                ? 'border-[#1565FF] bg-[#EFF6FF] text-[#1565FF]'
                : 'border-[#E2E8F0] text-[#64748B] hover:border-[#93C5FD]'
            }`}
          >
            <CreditCard className="w-4 h-4 inline mr-1.5" strokeWidth={2} />PayPal
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={submit}
        disabled={loading || !selectedPkg}
        className="w-full bg-[#1565FF] text-white font-semibold py-3.5 rounded-xl hover:bg-[#0D4FCC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {loading
          ? 'Đang chuyển hướng...'
          : selectedPkg
            ? `Nạp ${(selectedPkg.credits + selectedPkg.bonus_credits).toLocaleString()} Cr — ${selectedPkg.price_vnd.toLocaleString('vi-VN')} VND`
            : 'Chọn gói để tiếp tục'}
      </button>

      <p className="text-[11px] text-[#94A3B8] text-center">
        Credits không có thời hạn sử dụng. Thanh toán được xử lý bởi PayPal / payOS.
      </p>
    </div>
  )
}
