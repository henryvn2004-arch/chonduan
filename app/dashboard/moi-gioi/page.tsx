import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MarkLeadButton from './MarkLeadButton'

const SLOT_TYPE_LABEL: Record<string, string> = {
  sale: 'Mua / Bán',
  rent_long: 'Cho thuê dài hạn',
  rent_short: 'Cho thuê ngắn hạn',
}

const LEAD_STATUS_LABEL: Record<string, string> = {
  new: 'Mới',
  contacted: 'Đã liên hệ',
  qualified: 'Tiềm năng',
  converted: 'Thành công',
  lost: 'Không thành',
}

const LEAD_STATUS_COLOR: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700',
  contacted: 'bg-gray-100 text-gray-600',
  qualified: 'bg-yellow-50 text-yellow-700',
  converted: 'bg-green-50 text-green-700',
  lost: 'bg-red-50 text-red-600',
}

function fmtCr(n: number) {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return `${n}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const metadata = { title: 'Dashboard Môi giới — ChonDuAn' }

export default async function AgentDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dang-nhap?next=/dashboard/moi-gioi')

  // Get agent profile
  const { data: agent } = await supabase
    .from('agents')
    .select('id, display_name, slug, tier, kyc_status, leads_received_count, deals_closed_count')
    .eq('user_id', user.id)
    .single()

  if (!agent) redirect('/dang-ky/moi-gioi')

  // Fetch wallet, bids, leads in parallel
  const [
    { data: wallet },
    { data: bids },
    { data: leads },
  ] = await Promise.all([
    supabase
      .from('wallets')
      .select('balance_credits, total_topped_up_credits, total_spent_credits')
      .eq('owner_type', 'agent')
      .eq('owner_id', agent.id)
      .single(),

    supabase
      .from('agent_bids')
      .select('id, slot_type, bid_amount_weekly_credits, slot_rank, status, ends_at, projects(id, name_official, slug, province)')
      .eq('agent_id', agent.id)
      .eq('status', 'active')
      .order('slot_rank', { ascending: true, nullsFirst: false }),

    supabase
      .from('leads')
      .select('id, contact_name, contact_phone, contact_email, transaction_type, status, created_at, message, projects(name_official, slug, province)')
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const balance = Number(wallet?.balance_credits ?? 0)
  const newLeads = (leads ?? []).filter(l => l.status === 'new').length

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <Link href="/" className="text-xs text-[#64748B] hover:text-[#1565FF] mb-1 block">← Về trang chủ</Link>
          <h1 className="text-lg font-bold text-[#0D1B3D]">Dashboard Môi giới</h1>
          <p className="text-xs text-[#64748B]">{agent.display_name}</p>
        </div>
        <div className="flex items-center gap-3">
          {agent.kyc_status !== 'approved' && (
            <span className="text-xs bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full font-medium">
              Chờ xét duyệt KYC
            </span>
          )}
          <Link
            href={`/moi-gioi/${agent.slug}`}
            className="text-xs text-[#1565FF] font-medium hover:underline"
          >
            Xem profile →
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className="text-xs text-[#64748B] mb-1">Ví</div>
            <div className="text-xl font-bold text-[#0D1B3D]">{fmtCr(balance)}</div>
            <div className="text-[10px] text-[#94A3B8]">credits</div>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className="text-xs text-[#64748B] mb-1">Lead mới</div>
            <div className={`text-xl font-bold ${newLeads > 0 ? 'text-[#1565FF]' : 'text-[#0D1B3D]'}`}>{newLeads}</div>
            <div className="text-[10px] text-[#94A3B8]">chưa liên hệ</div>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className="text-xs text-[#64748B] mb-1">Tổng leads</div>
            <div className="text-xl font-bold text-[#0D1B3D]">{agent.leads_received_count ?? 0}</div>
            <div className="text-[10px] text-[#94A3B8]">từ trước đến nay</div>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className="text-xs text-[#64748B] mb-1">Giao dịch</div>
            <div className="text-xl font-bold text-[#0D1B3D]">{agent.deals_closed_count ?? 0}</div>
            <div className="text-[10px] text-[#94A3B8]">đã đóng</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Leads */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#0D1B3D]">Leads nhận được</h2>
              <span className="text-xs text-[#64748B]">{leads?.length ?? 0} gần nhất</span>
            </div>

            {(leads ?? []).length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-8 text-center">
                <p className="text-sm text-[#94A3B8]">Chưa có lead nào. Bid slot để xuất hiện trên trang dự án!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(leads ?? []).map((lead) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const proj = (lead as any).projects
                  return (
                    <div key={lead.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-[#0D1B3D]">{lead.contact_name}</span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${LEAD_STATUS_COLOR[lead.status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {LEAD_STATUS_LABEL[lead.status] ?? lead.status}
                            </span>
                          </div>
                          <a href={`tel:${lead.contact_phone}`} className="text-sm text-[#1565FF] font-medium hover:underline">
                            {lead.contact_phone}
                          </a>
                          {proj && (
                            <div className="text-xs text-[#64748B] mt-0.5 truncate">
                              {proj.name_official} · {SLOT_TYPE_LABEL[lead.transaction_type] ?? lead.transaction_type}
                            </div>
                          )}
                          {lead.message && (
                            <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2">{lead.message}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] text-[#94A3B8] mb-1">{fmtDate(lead.created_at)}</div>
                          <MarkLeadButton leadId={lead.id} current={lead.status} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: Bids + Wallet */}
          <div className="space-y-4">
            {/* Active bids */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-[#0D1B3D]">Slot đang bid</h2>
                <Link href="/dashboard/moi-gioi/bid" className="text-xs text-[#1565FF] hover:underline">+ Bid mới</Link>
              </div>

              {(bids ?? []).length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-5 text-center">
                  <p className="text-sm text-[#94A3B8] mb-2">Chưa bid slot nào.</p>
                  <Link href="/dashboard/moi-gioi/bid" className="text-xs text-[#1565FF] font-medium hover:underline">
                    Bid ngay để xuất hiện trên dự án →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {(bids ?? []).map((bid) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const proj = (bid as any).projects
                    const rankColor = bid.slot_rank === 1 ? 'text-yellow-600' : bid.slot_rank === 2 ? 'text-gray-500' : bid.slot_rank === 3 ? 'text-orange-600' : 'text-red-400'
                    return (
                      <div key={bid.id} className="bg-white rounded-xl border border-[#E2E8F0] p-3">
                        <div className="text-xs font-semibold text-[#0D1B3D] leading-snug line-clamp-1">
                          {proj?.name_official ?? 'Dự án'}
                        </div>
                        <div className="text-[10px] text-[#64748B] mt-0.5">{SLOT_TYPE_LABEL[bid.slot_type]}</div>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs font-bold ${rankColor}`}>
                            {bid.slot_rank ? `#${bid.slot_rank}` : 'Ngoài top'}
                          </span>
                          <span className="text-xs text-[#64748B]">{fmtCr(bid.bid_amount_weekly_credits)}/tuần</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Wallet */}
            <div>
              <h2 className="font-semibold text-[#0D1B3D] mb-3">Ví của tôi</h2>
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                <div className="text-2xl font-bold text-[#0D1B3D]">
                  {balance.toLocaleString('vi-VN')} <span className="text-sm font-normal text-[#64748B]">Cr</span>
                </div>
                <div className="flex gap-4 mt-2 text-[10px] text-[#94A3B8]">
                  <span>Đã nạp: {fmtCr(wallet?.total_topped_up_credits ?? 0)}</span>
                  <span>Đã chi: {fmtCr(wallet?.total_spent_credits ?? 0)}</span>
                </div>
                <button
                  disabled
                  className="mt-3 w-full bg-[#1565FF] text-white text-xs font-semibold py-2.5 rounded-lg opacity-60 cursor-not-allowed"
                  title="Sắp ra mắt"
                >
                  Nạp tiền (sắp ra mắt)
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
