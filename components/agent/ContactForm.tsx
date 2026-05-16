'use client'

import { useState } from 'react'

interface Agent {
  id: string
  display_name: string
  phone: string
}

interface Props {
  agent: Agent
  projectId?: string
  mode?: 'sale' | 'rent_long'
  onClose: () => void
}

const BEDROOM_OPTIONS = [
  { value: '1br', label: '1 phòng ngủ' },
  { value: '2br', label: '2 phòng ngủ' },
  { value: '3br', label: '3 phòng ngủ' },
  { value: '4br+', label: '4+ phòng ngủ' },
]

export default function ContactForm({ agent, projectId, mode = 'sale', onClose }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [budgetMonthly, setBudgetMonthly] = useState('')
  const [budgetTotal, setBudgetTotal] = useState('')
  const [moveIn, setMoveIn] = useState('')
  const [furnished, setFurnished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!name || !phone) {
      setError('Vui lòng điền tên và số điện thoại')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agent.id,
          project_id: projectId ?? null,
          transaction_type: mode,
          contact_name: name,
          contact_phone: phone,
          contact_email: email || null,
          message: message || null,
          preferred_bedrooms: bedrooms || null,
          budget_monthly_vnd: budgetMonthly ? parseInt(budgetMonthly) * 1_000_000 : null,
          budget_total_vnd: budgetTotal ? parseInt(budgetTotal) * 1_000_000_000 : null,
          preferred_move_in_date: moveIn || null,
          needs_furnished: mode === 'rent_long' ? furnished : null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Lỗi gửi')
      }
      setSent(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi gửi yêu cầu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <h2 className="font-semibold text-[#0D1B3D]">Liên hệ {agent.display_name}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] text-[#94A3B8]">✕</button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-[#0D1B3D] mb-1">Đã gửi yêu cầu!</p>
            <p className="text-sm text-[#64748B]">Môi giới sẽ liên hệ bạn trong thời gian sớm nhất.</p>
            <button onClick={onClose} className="mt-5 w-full bg-[#1565FF] text-white font-semibold py-2.5 rounded-xl">Đóng</button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-[#64748B] mb-1 block">Họ tên *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Nguyễn Văn A"
                  className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1565FF]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1 block">Điện thoại *</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="09xxxxxxxx"
                  className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1565FF]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1 block">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="(tùy chọn)"
                  className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1565FF]" />
              </div>
            </div>

            {mode === 'sale' && (
              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1 block">Ngân sách (tỷ VND)</label>
                <input type="number" min={0} value={budgetTotal} onChange={e => setBudgetTotal(e.target.value)} placeholder="Ví dụ: 3.5"
                  className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1565FF]" />
              </div>
            )}

            {mode === 'rent_long' && (
              <>
                <div>
                  <label className="text-xs font-medium text-[#64748B] mb-1 block">Số phòng ngủ</label>
                  <div className="flex gap-2 flex-wrap">
                    {BEDROOM_OPTIONS.map(b => (
                      <button key={b.value} onClick={() => setBedrooms(b.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${bedrooms === b.value ? 'bg-[#1565FF] text-white border-[#1565FF]' : 'border-[#E2E8F0] text-[#0D1B3D] hover:border-[#1565FF]'}`}>
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#64748B] mb-1 block">Ngân sách (tr/tháng)</label>
                    <input type="number" min={0} value={budgetMonthly} onChange={e => setBudgetMonthly(e.target.value)} placeholder="20"
                      className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1565FF]" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#64748B] mb-1 block">Ngày dọn vào</label>
                    <input type="date" value={moveIn} onChange={e => setMoveIn(e.target.value)}
                      className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1565FF]" />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-[#0D1B3D]">
                  <input type="checkbox" checked={furnished} onChange={e => setFurnished(e.target.checked)} className="accent-[#1565FF]" />
                  Cần nội thất
                </label>
              </>
            )}

            <div>
              <label className="text-xs font-medium text-[#64748B] mb-1 block">Tin nhắn</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                placeholder="Tôi muốn tìm hiểu thêm về dự án..."
                className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1565FF] resize-none" />
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-[#1565FF] text-white font-semibold py-3 rounded-xl hover:bg-[#0D4FCC] transition-colors disabled:opacity-50">
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu liên hệ'}
            </button>

            <p className="text-xs text-center text-[#94A3B8]">
              Hoặc gọi trực tiếp: <a href={`tel:${agent.phone}`} className="text-[#1565FF] font-medium">{agent.phone}</a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
