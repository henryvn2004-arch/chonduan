'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AgencyQueueClient({ agencyId }: { agencyId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  async function handle(action: 'approve' | 'reject') {
    if (action === 'reject' && !confirm('Từ chối và xoá hồ sơ sàn này?')) return
    setLoading(action)
    try {
      await fetch(`/api/agencies/${agencyId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2 shrink-0">
      <button
        onClick={() => handle('approve')} disabled={!!loading}
        className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:opacity-50"
      >
        {loading === 'approve' ? '...' : '✓ Duyệt'}
      </button>
      <button
        onClick={() => handle('reject')} disabled={!!loading}
        className="px-4 py-2 border border-red-300 text-red-500 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50"
      >
        {loading === 'reject' ? '...' : '✕ Từ chối'}
      </button>
    </div>
  )
}
