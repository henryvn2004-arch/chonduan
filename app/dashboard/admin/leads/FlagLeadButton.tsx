'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FlagLeadButton({ leadId }: { leadId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleFlag() {
    if (!confirm('Đánh dấu lead này là nghi ngờ gian lận?')) return
    setLoading(true)
    await fetch(`/api/leads/${leadId}/flag`, { method: 'POST' })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleFlag}
      disabled={loading}
      className="text-xs text-orange-600 hover:text-orange-800 font-medium disabled:opacity-50"
    >
      {loading ? '...' : 'Flag'}
    </button>
  )
}
