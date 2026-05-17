'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'

interface Project {
  id: string
  name_official: string
  province: string
}

const BOOST_COST = 500

export default function ArticleEditor({
  bidProjects,
  walletBalance,
}: {
  bidProjects: Project[]
  walletBalance: number
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [projectId, setProjectId] = useState('')
  const [boost, setBoost] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const canBoost = walletBalance >= BOOST_COST

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content_markdown: content,
        related_project_id: projectId || undefined,
        boost,
      }),
    })
    const data = await res.json()
    setLoading(false)

    if (data.ok) {
      setTitle('')
      setContent('')
      setProjectId('')
      setBoost(false)
      router.refresh()
    } else {
      setError(data.error ?? 'Lỗi khi đăng bài')
    }
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#374151] mb-1">Tiêu đề *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ví dụ: 5 lý do nên chọn Vinhomes Grand Park để đầu tư 2026"
          className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#1565FF]"
          required
          minLength={10}
          maxLength={150}
        />
        <p className="text-[10px] text-[#94A3B8] mt-0.5">{title.length}/150</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#374151] mb-1">Nội dung * (Markdown)</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Viết nội dung bài viết... (tối thiểu 200 ký tự)"
          rows={12}
          className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#1565FF] font-mono resize-y"
          required
          minLength={200}
        />
        <p className="text-[10px] text-[#94A3B8] mt-0.5">{wordCount} từ · {content.length} ký tự</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#374151] mb-1">Liên kết dự án (không bắt buộc)</label>
        <select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1565FF] bg-white"
        >
          <option value="">Không liên kết dự án cụ thể</option>
          {bidProjects.map(p => (
            <option key={p.id} value={p.id}>
              {p.name_official} — {p.province}
            </option>
          ))}
        </select>
      </div>

      {/* Boost option */}
      <div className={`rounded-xl border p-4 ${boost ? 'border-[#1565FF] bg-blue-50' : 'border-[#E2E8F0] bg-white'}`}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={boost}
            onChange={e => setBoost(e.target.checked)}
            disabled={!canBoost}
            className="mt-0.5 w-4 h-4 accent-[#1565FF]"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-[#0D1B3D]"><Zap className="w-4 h-4 text-[#1565FF]" strokeWidth={2} /> Boost bài viết — {BOOST_COST} Cr</span>
              {!canBoost && (
                <span className="text-[10px] text-red-500 font-medium">Không đủ credits</span>
              )}
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Bài xuất hiện nổi bật trong phần Tin tức của trang dự án liên kết trong 30 ngày.
              {' '}Hiện có: {walletBalance} Cr.
            </p>
          </div>
        </label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading || !title || !content}
        className="w-full bg-[#1565FF] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#0D4FCC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Đang đăng...' : boost ? `Đăng + Boost (${BOOST_COST} Cr)` : 'Đăng bài viết (miễn phí)'}
      </button>
      <p className="text-[10px] text-center text-[#94A3B8]">
        Bài viết được kiểm duyệt tự động. Nội dung vi phạm sẽ bị xóa.
      </p>
    </form>
  )
}
