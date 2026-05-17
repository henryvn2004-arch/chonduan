'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RefundLeadButton({
  leadId,
  credits,
}: {
  leadId: string
  credits: number
}) {
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [reason, setReason] = useState('')
  const router = useRouter()

  async function handleRefund() {
    if (!reason.trim()) return
    setLoading(true)
    const res = await fetch(`/api/leads/${leadId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    setLoading(false)
    if (res.ok) {
      setShowForm(false)
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error ?? 'Lỗi hoàn tiền')
    }
  }

  if (showForm) {
    return (
      <div className="flex flex-col gap-1 min-w-[200px]">
        <input
          type="text"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Lý do hoàn tiền..."
          className="text-xs border border-gray-200 rounded px-2 py-1 w-full focus:outline-none focus:border-[#1565FF]"
          autoFocus
        />
        <div className="flex gap-1">
          <button
            onClick={handleRefund}
            disabled={loading || !reason.trim()}
            className="flex-1 text-xs bg-purple-600 text-white rounded px-2 py-1 hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? '...' : `Hoàn ${credits} Cr`}
          </button>
          <button
            onClick={() => setShowForm(false)}
            className="text-xs text-gray-500 hover:text-gray-700 px-1"
          >
            Hủy
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="text-xs text-purple-600 hover:text-purple-800 font-medium"
    >
      Hoàn tiền
    </button>
  )
}
