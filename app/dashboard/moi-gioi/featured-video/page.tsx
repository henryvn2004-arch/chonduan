import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Play } from 'lucide-react'
import FeaturedVideoForm from './FeaturedVideoForm'

export const metadata = { title: 'Featured Video — PhaplyDuan' }

export default async function FeaturedVideoPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dang-nhap?next=/dashboard/moi-gioi/featured-video')

  const { data: agent } = await supabase
    .from('agents')
    .select('id, kyc_status')
    .eq('user_id', user.id)
    .single()

  if (!agent || agent.kyc_status !== 'approved') redirect('/dashboard/moi-gioi')

  // Projects agent is actively bidding on
  const [{ data: bids }, { data: wallet }, { data: activeVideos }] = await Promise.all([
    supabase
      .from('agent_bids')
      .select('project_id, projects(id, name_official, province)')
      .eq('agent_id', agent.id)
      .eq('status', 'active'),
    supabase
      .from('wallets')
      .select('balance_credits')
      .eq('owner_type', 'agent')
      .eq('owner_id', agent.id)
      .single(),
    supabase
      .from('featured_videos')
      .select('project_id, video_url, video_type, expires_at')
      .eq('agent_id', agent.id)
      .eq('active', true)
      .gt('expires_at', new Date().toISOString()),
  ])

  // Deduplicate projects from bids
  const seen = new Set<string>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects = (bids ?? []).map((b: any) => b.projects as { id: string; name_official: string; province: string } | null)
    .filter((p): p is { id: string; name_official: string; province: string } => {
      if (!p || seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-4">
        <Link href="/dashboard/moi-gioi" className="text-xs text-[#64748B] hover:text-[#1565FF] mb-1 block">
          ← Dashboard
        </Link>
        <h1 className="flex items-center gap-2 text-lg font-bold text-[#0D1B3D]">
          <Play className="w-5 h-5 text-[#1565FF]" strokeWidth={2} /> Featured Video
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">Video YouTube/TikTok hiển thị trong card môi giới trên trang dự án</p>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          <p className="font-medium mb-1">Cách hoạt động</p>
          <ul className="text-xs space-y-1 text-blue-600">
            <li>• Video xuất hiện ngay trong card của bạn trên trang dự án</li>
            <li>• YouTube: nhúng trực tiếp (iframe) · TikTok: link có nhãn video</li>
            <li>• Chỉ áp dụng cho dự án bạn đang bid slot</li>
            <li>• Giá: 250 Cr/tháng ≈ $10 · Hết hạn không tự gia hạn</li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          {projects.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-[#94A3B8] mb-2">Bạn chưa bid slot dự án nào.</p>
              <Link href="/dashboard/moi-gioi/bid" className="text-sm text-[#1565FF] font-medium hover:underline">
                Bid slot ngay →
              </Link>
            </div>
          ) : (
            <FeaturedVideoForm
              projects={projects}
              activeVideos={activeVideos ?? []}
              walletBalance={wallet?.balance_credits ?? 0}
            />
          )}
        </div>
      </main>
    </div>
  )
}
