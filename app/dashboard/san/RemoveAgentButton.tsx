'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

export default function RemoveAgentButton({ agentId, agentName }: { agentId: string; agentName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRemove() {
    if (!confirm(`Xoá ${agentName} khỏi sàn?`)) return
    setLoading(true)
    await fetch('/api/agencies/agents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleRemove} disabled={loading}
      className="p-1.5 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
      title="Xoá khỏi sàn"
    >
      <X className="w-4 h-4" strokeWidth={2} />
    </button>
  )
}
