'use client'

import { useState } from 'react'

export default function SubscribeButton() {
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    const res = await fetch('/api/subscriptions/verified-badge', { method: 'POST' })
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
      onClick={handleSubscribe}
      disabled={loading}
      className="w-full bg-[#1565FF] text-white font-semibold py-3 rounded-xl hover:bg-[#0D4FCC] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? 'Đang chuyển đến PayPal...' : 'Đăng ký Verified — $5/tháng'}
    </button>
  )
}
