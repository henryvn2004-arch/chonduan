'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, MapPin, Phone, Globe, Calendar, FileText } from 'lucide-react'

const PROVINCES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'Bình Dương', 'Đồng Nai', 'Long An', 'Khánh Hòa', 'Lâm Đồng',
  'Quảng Nam', 'Thừa Thiên Huế', 'Bà Rịa - Vũng Tàu', 'Tỉnh khác',
]

export default function SanSignupClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    hq_province: '',
    hq_address: '',
    founded_year: '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim() || !form.hq_province) {
      setError('Vui lòng điền đủ thông tin bắt buộc')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Lỗi đăng ký'); return }
      router.push('/dashboard/san?registered=1')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-xl">
      <div className="mb-6">
        <div className="w-12 h-12 bg-[#1565FF] rounded-2xl flex items-center justify-center mb-4">
          <Building2 className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-[#0D1B3D]">Đăng ký Sàn môi giới</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Quản lý đội nhóm, theo dõi hiệu suất và nhận ưu đãi theo nhóm
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
          <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide">Thông tin sàn</p>

          <div>
            <label className="text-sm font-medium text-[#374151] block mb-1.5">
              Tên sàn <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" strokeWidth={1.5} />
              <input
                value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="VD: Sàn Vinhomes Hà Nội"
                className="w-full pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#1565FF] focus:ring-1 focus:ring-[#1565FF]/20"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[#374151] block mb-1.5">
              Tỉnh/Thành phố <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" strokeWidth={1.5} />
              <select
                value={form.hq_province} onChange={e => set('hq_province', e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#1565FF] appearance-none bg-white"
              >
                <option value="">Chọn tỉnh/thành...</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[#374151] block mb-1.5">Địa chỉ văn phòng</label>
            <input
              value={form.hq_address} onChange={e => set('hq_address', e.target.value)}
              placeholder="Số nhà, đường, quận/huyện..."
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#1565FF]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#374151] block mb-1.5">Mô tả ngắn</label>
            <textarea
              value={form.description} onChange={e => set('description', e.target.value)}
              rows={3}
              placeholder="Giới thiệu về sàn của bạn..."
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#1565FF] resize-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
          <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide">Liên hệ</p>

          <div>
            <label className="text-sm font-medium text-[#374151] block mb-1.5">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" strokeWidth={1.5} />
              <input
                value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="0901 234 567"
                className="w-full pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#1565FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-[#374151] block mb-1.5">Email</label>
              <input
                value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="info@san.vn"
                type="email"
                className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#1565FF]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#374151] block mb-1.5">Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" strokeWidth={1.5} />
                <input
                  value={form.website} onChange={e => set('website', e.target.value)}
                  placeholder="san.vn"
                  className="w-full pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#1565FF]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[#374151] block mb-1.5">Năm thành lập</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" strokeWidth={1.5} />
              <input
                value={form.founded_year} onChange={e => set('founded_year', e.target.value)}
                placeholder="2020" type="number" min="1990" max="2026"
                className="w-full pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#1565FF]"
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-700">
          <FileText className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.5} />
          <span>Hồ sơ sẽ được admin duyệt trong <strong>1–2 ngày làm việc</strong>. Sau khi duyệt, bạn có thể thêm nhân viên và đăng ký gói.</span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <button
          type="submit" disabled={loading}
          className="w-full bg-[#1565FF] text-white font-semibold py-3 rounded-xl hover:bg-[#0D4FCC] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Đang gửi...' : 'Gửi đăng ký'}
        </button>
      </form>
    </div>
  )
}
