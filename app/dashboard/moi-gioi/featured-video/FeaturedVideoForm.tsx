'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Project {
  id: string
  name_official: string
  province: string
}

interface ActiveVideo {
  project_id: string
  video_url: string
  video_type: string
  expires_at: string
}

export default function FeaturedVideoForm({
  projects,
  activeVideos,
  walletBalance,
}: {
  projects: Project[]
  activeVideos: ActiveVideo[]
  walletBalance: number
}) {
  const [projectId, setProjectId] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const COST = 250
  const canAfford = walletBalance >= COST

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!projectId || !videoUrl) return
    setError('')
    setLoading(true)
    const res = await fetch('/api/featured-videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, video_url: videoUrl }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.ok) {
      setVideoUrl('')
      setProjectId('')
      router.refresh()
    } else {
      setError(data.error ?? 'Lỗi khi thêm video')
    }
  }

  async function handleRemove(pid: string) {
    if (!confirm('Xóa featured video cho dự án này?')) return
    await fetch(`/api/featured-videos?project_id=${pid}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Active videos */}
      {activeVideos.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#0D1B3D] mb-3">Video đang hoạt động</h3>
          <div className="space-y-2">
            {activeVideos.map(v => {
              const proj = projects.find(p => p.id === v.project_id)
              return (
                <div key={v.project_id} className="flex items-center justify-between bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-3">
                  <div>
                    <div className="text-sm font-medium text-[#0D1B3D]">{proj?.name_official ?? v.project_id}</div>
                    <a href={v.video_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1565FF] hover:underline truncate max-w-[200px] block">
                      {v.video_url}
                    </a>
                    <div className="text-[10px] text-[#94A3B8] mt-0.5">
                      Hết hạn: {new Date(v.expires_at).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(v.project_id)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0 ml-3"
                  >
                    Xóa
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add new */}
      <div>
        <h3 className="text-sm font-semibold text-[#0D1B3D] mb-3">
          Thêm Featured Video — {COST} Cr/tháng
        </h3>

        {!canAfford && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 mb-3">
            Không đủ credits. Cần {COST} Cr · Hiện có {walletBalance} Cr.{' '}
            <a href="/dashboard/moi-gioi/nap-tien" className="font-medium underline">Nạp thêm →</a>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Dự án</label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1565FF] bg-white"
              required
            >
              <option value="">Chọn dự án bạn đang bid...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name_official} — {p.province}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">
              URL YouTube hoặc TikTok
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... hoặc https://tiktok.com/..."
              className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1565FF]"
              required
            />
            <p className="text-[10px] text-[#94A3B8] mt-1">Video sẽ hiển thị trong card môi giới trên trang dự án</p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading || !canAfford || !projectId || !videoUrl}
            className="w-full bg-[#1565FF] text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-[#0D4FCC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xử lý...' : `Kích hoạt Video — ${COST} Cr`}
          </button>
        </form>
      </div>
    </div>
  )
}
