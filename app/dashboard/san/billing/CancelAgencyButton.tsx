'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CancelAgencyButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    if (!confirm('Huỷ gói sẽ xoá quyền truy cập của nhân viên vào tính năng Pro. Xác nhận?')) return
    setLoading(true)
    const res = await fetch('/api/subscriptions/agency', { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { alert(data.error ?? 'Lỗi huỷ'); setLoading(false); return }
    router.refresh()
  }

  return (
    <button
      onClick={handleCancel} disabled={loading}
      className="text-xs text-[#94A3B8] hover:text-red-500 transition-colors"
    >
      {loading ? 'Đang huỷ...' : 'Huỷ gói'}
    </button>
  )
}
