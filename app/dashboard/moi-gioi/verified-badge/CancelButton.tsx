'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CancelButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCancel() {
    if (!confirm('Hủy gói Verified? Huy hiệu sẽ bị xóa ngay lập tức.')) return
    setLoading(true)
    const res = await fetch('/api/subscriptions/verified-badge', { method: 'DELETE' })
    const data = await res.json()
    if (data.ok) {
      router.refresh()
    } else {
      alert(data.error ?? 'Lỗi hủy gói')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
    >
      {loading ? 'Đang hủy...' : 'Hủy gói'}
    </button>
  )
}
