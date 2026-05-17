import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import ArticleEditor from './ArticleEditor'

export const metadata = { title: 'Bài viết của tôi — ChonDuAn' }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function AgentArticlesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dang-nhap?next=/dashboard/moi-gioi/bai-viet')

  const { data: agent } = await supabase
    .from('agents')
    .select('id, kyc_status')
    .eq('user_id', user.id)
    .single()

  if (!agent || agent.kyc_status !== 'approved') redirect('/dashboard/moi-gioi')

  const [{ data: bids }, { data: wallet }, { data: articles }] = await Promise.all([
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
      .from('khao_luan')
      .select('id, slug, title, is_boosted, boost_expires_at, published, generated_at, views_count')
      .eq('agent_id', agent.id)
      .order('generated_at', { ascending: false })
      .limit(20),
  ])

  // Deduplicate projects
  const seen = new Set<string>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bidProjects = (bids ?? []).map((b: any) => b.projects as { id: string; name_official: string; province: string } | null)
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
        <h1 className="text-lg font-bold text-[#0D1B3D]">Bài viết của tôi</h1>
        <p className="text-xs text-[#64748B] mt-0.5">Đăng bài miễn phí · Boost để xuất hiện nổi bật trên trang dự án</p>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Article list */}
        {(articles ?? []).length > 0 && (
          <div>
            <h2 className="font-semibold text-[#0D1B3D] mb-3 text-sm">Bài đã đăng ({articles?.length})</h2>
            <div className="space-y-2">
              {(articles ?? []).map(art => (
                <div key={art.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/kham-pha/${art.slug}`}
                        target="_blank"
                        className="text-sm font-medium text-[#0D1B3D] hover:text-[#1565FF] line-clamp-1"
                      >
                        {art.title}
                      </Link>
                      {art.is_boosted && art.boost_expires_at && new Date(art.boost_expires_at) > new Date() && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                          <Zap className="w-2.5 h-2.5" strokeWidth={2.5} /> Boosted
                        </span>
                      )}
                      {art.is_boosted && art.boost_expires_at && new Date(art.boost_expires_at) <= new Date() && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                          Boost hết hạn
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#94A3B8] mt-0.5">
                      {fmtDate(art.generated_at)} · {art.views_count ?? 0} lượt xem
                      {art.is_boosted && art.boost_expires_at && new Date(art.boost_expires_at) > new Date() && (
                        <span className="ml-2">· Boost đến {fmtDate(art.boost_expires_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Write new article */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <h2 className="font-semibold text-[#0D1B3D] mb-4">Viết bài mới</h2>
          <ArticleEditor
            bidProjects={bidProjects}
            walletBalance={wallet?.balance_credits ?? 0}
          />
        </div>

        <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-4 text-xs text-[#64748B] space-y-1.5">
          <p className="font-semibold text-[#0D1B3D] mb-1.5">Quy định bài viết</p>
          <p>• Nội dung phải liên quan đến bất động sản — không spam, không quảng cáo sai sự thật</p>
          <p>• Bài viết đăng tên môi giới của bạn — đại diện cho uy tín cá nhân</p>
          <p>• Boost: bài xuất hiện đầu mục "Tin từ môi giới" trong trang dự án liên kết</p>
          <p>• Bài không boost vẫn được đăng công khai tại /kham-pha/</p>
        </div>
      </main>
    </div>
  )
}
