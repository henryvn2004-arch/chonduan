import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BidForm from './BidForm'
import CancelBidButton from './CancelBidButton'

export const metadata = { title: 'Bid Slot — ChonDuAn' }

const SLOT_LABEL: Record<string, string> = {
  sale: '🏠 Mua / Bán',
  rent_long: '🔑 Cho thuê dài hạn',
  rent_short: '🏨 Cho thuê ngắn hạn',
}

const RANK_COLOR: Record<number, string> = {
  1: 'text-yellow-600 font-bold',
  2: 'text-gray-500 font-semibold',
  3: 'text-orange-600 font-semibold',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

export default async function BidPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dang-nhap?next=/dashboard/moi-gioi/bid')

  const { data: agent } = await supabase
    .from('agents')
    .select('id, display_name, kyc_status, specialty_types')
    .eq('user_id', user.id)
    .single()

  if (!agent) redirect('/dang-ky/moi-gioi')
  if (agent.kyc_status !== 'approved') redirect('/dashboard/moi-gioi')

  const [{ data: wallet }, { data: bids }] = await Promise.all([
    supabase
      .from('wallets')
      .select('balance_credits')
      .eq('owner_type', 'agent')
      .eq('owner_id', agent.id)
      .single(),
    supabase
      .from('agent_bids')
      .select('id, slot_type, bid_amount_weekly_credits, slot_rank, ends_at, projects(id, name_official, slug, province)')
      .eq('agent_id', agent.id)
      .eq('status', 'active')
      .order('slot_type')
      .order('bid_amount_weekly_credits', { ascending: false }),
  ])

  const balance = wallet?.balance_credits ?? 0
  const specialties: string[] = agent.specialty_types ?? ['sale']

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <Link href="/dashboard/moi-gioi" className="text-xs text-[#64748B] hover:text-[#1565FF] mb-1 block">← Dashboard</Link>
          <h1 className="text-lg font-bold text-[#0D1B3D]">Quản lý Bid Slot</h1>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#64748B]">Số dư ví</div>
          <div className="text-lg font-bold text-[#0D1B3D]">{balance.toLocaleString()} <span className="text-sm font-normal text-[#64748B]">Cr</span></div>
          <div className="text-[10px] text-[#94A3B8]">≈ {(balance * 1000).toLocaleString('vi-VN')} VND</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Active bids */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[#0D1B3D]">Slot đang hoạt động ({bids?.length ?? 0})</h2>
          </div>

          {(bids ?? []).length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-8 text-center">
              <p className="text-sm text-[#94A3B8]">Chưa có bid nào. Đặt bid bên dưới để xuất hiện trên trang dự án.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(bids ?? []).map(bid => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const proj = (bid as any).projects
                const rankColor = bid.slot_rank ? (RANK_COLOR[bid.slot_rank] ?? 'text-red-400') : 'text-[#94A3B8]'
                return (
                  <div key={bid.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-[#64748B] mb-0.5">{SLOT_LABEL[bid.slot_type]}</div>
                        <div className="font-semibold text-sm text-[#0D1B3D] leading-snug truncate">
                          {proj?.name_official ?? 'Dự án'}
                        </div>
                        <div className="text-[11px] text-[#94A3B8]">{proj?.province}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-lg ${rankColor}`}>
                          {bid.slot_rank ? `#${bid.slot_rank}` : '—'}
                        </div>
                        <div className="text-[10px] text-[#94A3B8]">hạng</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F1F5F9]">
                      <div>
                        <span className="text-sm font-semibold text-[#0D1B3D]">{bid.bid_amount_weekly_credits} Cr</span>
                        <span className="text-xs text-[#94A3B8]">/tuần</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {bid.ends_at && (
                          <span className="text-[10px] text-[#94A3B8]">hết {fmtDate(bid.ends_at)}</span>
                        )}
                        <CancelBidButton bidId={bid.id} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Place bid */}
        {balance === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <p className="text-sm text-amber-800 font-medium mb-1">Số dư ví bằng 0</p>
            <p className="text-xs text-amber-700">Nạp credits để bắt đầu bid slot trên các dự án.</p>
            <button disabled className="mt-3 bg-[#1565FF] text-white text-xs font-semibold px-5 py-2.5 rounded-xl opacity-50 cursor-not-allowed">
              Nạp tiền (sắp ra mắt)
            </button>
          </div>
        ) : (
          <BidForm specialties={specialties} walletBalance={balance} />
        )}

        {/* Info */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 text-xs text-[#64748B] space-y-1.5">
          <p className="font-semibold text-[#0D1B3D] mb-2">Cách tính hạng slot</p>
          <p>• Hạng được tính theo số credits bid/tuần — càng cao càng ưu tiên.</p>
          <p>• Top 3 bid cao nhất xuất hiện trên trang dự án theo đúng hạng.</p>
          <p>• Hạng cập nhật mỗi giờ. Hủy bid → mất hạng ngay lập tức.</p>
          <p>• Floor bid: 🏠 Sale = 100 Cr · 🔑 Thuê dài hạn = 50 Cr · 🏨 Thuê ngắn hạn = 30 Cr</p>
        </div>
      </main>
    </div>
  )
}
