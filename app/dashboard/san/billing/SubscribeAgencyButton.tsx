'use client'

import { useState } from 'react'

export default function SubscribeAgencyButton({ tier, label }: { tier: 'basic' | 'pro'; label: string }) {
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    const res = await fetch('/api/subscriptions/agency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier }),
    })
    const data = await res.json()
    if (data.redirect_url) {
      window.location.href = data.redirect_url
    } else {
      alert(data.error ?? 'Lỗi khởi tạo thanh toán')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSubscribe} disabled={loading}
      className="w-full bg-[#1565FF] text-white font-semibold py-3 rounded-xl hover:bg-[#0D4FCC] transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
    >
      {loading ? 'Đang chuyển đến PayPal...' : label}
    </button>
  )
}
