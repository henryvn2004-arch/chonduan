'use client'

import { useState } from 'react'

export default function MarkLeadButton({ leadId, current }: { leadId: string; current: string }) {
  const [status, setStatus] = useState(current)
  const [loading, setLoading] = useState(false)

  if (status === 'contacted') {
    return <span className="text-xs text-green-600 font-medium">Đã liên hệ</span>
  }

  async function mark() {
    setLoading(true)
    try {
      await fetch('/api/leads/' + leadId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'contacted' }),
      })
      setStatus('contacted')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={mark}
      disabled={loading}
      className="text-xs text-[#1565FF] font-medium hover:underline disabled:opacity-50"
    >
      {loading ? '...' : 'Đánh dấu đã liên hệ'}
    </button>
  )
}
