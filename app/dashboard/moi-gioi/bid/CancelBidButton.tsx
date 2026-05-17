'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CancelBidButton({ bidId }: { bidId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function cancel() {
    if (!confirm('Hủy bid này? Slot của bạn sẽ mất ngay lập tức.')) return
    setLoading(true)
    try {
      const res = await fetch('/api/bid', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bid_id: bidId }),
      })
      if (res.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={cancel}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 transition-colors"
    >
      {loading ? '...' : 'Hủy bid'}
    </button>
  )
}
