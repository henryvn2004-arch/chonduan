'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'

export default function InviteAgentForm() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim()) return
    setLoading(true)
    setMsg(null)
    const res = await fetch('/api/agencies/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg({ type: 'ok', text: `Đã thêm ${data.agent_name} vào sàn` })
      setPhone('')
      router.refresh()
    } else {
      setMsg({ type: 'err', text: data.error ?? 'Lỗi thêm nhân viên' })
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleInvite} className="flex gap-2 items-start">
      <input
        value={phone} onChange={e => setPhone(e.target.value)}
        placeholder="Số điện thoại môi giới..."
        className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#1565FF]"
      />
      <button
        type="submit" disabled={loading || !phone.trim()}
        className="flex items-center gap-1.5 px-4 py-2 bg-[#1565FF] text-white text-sm font-medium rounded-xl hover:bg-[#0D4FCC] disabled:opacity-50 whitespace-nowrap"
      >
        <UserPlus className="w-4 h-4" strokeWidth={2} />
        {loading ? 'Đang thêm...' : 'Thêm'}
      </button>
      {msg && (
        <p className={`text-xs mt-2 absolute ${msg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
          {msg.text}
        </p>
      )}
    </form>
  )
}
