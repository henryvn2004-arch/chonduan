'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function KycQueueClient({ agentId }: { agentId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  async function handle(action: 'approve' | 'reject') {
    setLoading(action)
    try {
      await fetch('/api/agents/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, action, reason: rejectReason || undefined }),
      })
      router.refresh()
    } finally {
      setLoading(null)
      setShowReject(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 shrink-0">
      <button
        onClick={() => handle('approve')}
        disabled={!!loading}
        className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
      >
        {loading === 'approve' ? 'Đang duyệt...' : '✓ Duyệt'}
      </button>
      {!showReject ? (
        <button
          onClick={() => setShowReject(true)}
          className="px-4 py-2 border border-red-300 text-red-500 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
        >
          ✕ Từ chối
        </button>
      ) : (
        <div className="space-y-1.5">
          <input
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Lý do từ chối..."
            className="w-full text-xs border border-[#E2E8F0] rounded-lg px-2 py-1.5 focus:outline-none focus:border-red-400"
          />
          <div className="flex gap-1">
            <button
              onClick={() => handle('reject')}
              disabled={!!loading}
              className="flex-1 px-2 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              {loading === 'reject' ? '...' : 'Xác nhận'}
            </button>
            <button onClick={() => setShowReject(false)} className="px-2 py-1.5 border border-[#E2E8F0] text-xs rounded-lg hover:bg-[#F8FAFC]">
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
