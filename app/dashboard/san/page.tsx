import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, Users, BadgeCheck, CreditCard, TrendingUp, Clock } from 'lucide-react'
import InviteAgentForm from './InviteAgentForm'
import RemoveAgentButton from './RemoveAgentButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard Sàn — ChonDuan' }

const TIER_LABEL: Record<string, string> = {
  free: 'Miễn phí', basic: 'Basic', pro: 'Pro', top: 'Top', agency: 'Agency'
}
const TIER_COLOR: Record<string, string> = {
  free: 'bg-gray-100 text-gray-500',
  basic: 'bg-blue-50 text-blue-700',
  pro: 'bg-purple-50 text-purple-700',
  top: 'bg-amber-50 text-amber-700',
}

const SPECIALTY_LABEL: Record<string, string> = {
  sale: '🏠 Mua/Bán', rent_long: '🔑 Cho thuê', rent_short: '🏨 Ngắn hạn'
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function SanDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dang-nhap?next=/dashboard/san')

  const { data: profile } = await supabase
    .from('user_profiles').select('user_type').eq('id', user.id).single()
  if (profile?.user_type !== 'agency_admin') redirect('/dang-ky/san')

  const service = await createServiceClient()
  const { data: agency } = await service
    .from('agencies')
    .select('id, name, slug, verified, subscription_tier, subscription_expires_at, agents_count, phone, email, hq_province, created_at')
    .eq('admin_user_id', user.id)
    .single()

  if (!agency) redirect('/dang-ky/san')

  // Fetch agents in this agency
  const { data: agents } = await service
    .from('agents')
    .select('id, slug, display_name, phone, email, avatar_url, kyc_status, tier, specialty_types, leads_received_count, deals_closed_count, avg_rating')
    .eq('agency_id', agency.id)
    .order('display_name')

  // Team leads this month
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const agentIds = (agents ?? []).map(a => a.id)
  let monthlyLeads = 0
  if (agentIds.length > 0) {
    const { count } = await service
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .in('agent_id', agentIds)
      .gte('created_at', monthStart.toISOString())
    monthlyLeads = count ?? 0
  }

  const isPaid = agency.subscription_tier && agency.subscription_tier !== 'free'

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#0D1B3D]">{agency.name}</h1>
              {agency.verified
                ? <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    <BadgeCheck className="w-3.5 h-3.5" /> Đã duyệt
                  </span>
                : <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Chờ duyệt
                  </span>
              }
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLOR[agency.subscription_tier ?? 'free'] ?? TIER_COLOR.free}`}>
                {TIER_LABEL[agency.subscription_tier ?? 'free']}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">{agency.hq_province} · {agency.phone}</p>
          </div>
          <Link
            href="/dashboard/san/billing"
            className="flex items-center gap-1.5 px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#374151] hover:border-[#1565FF] hover:text-[#1565FF] transition-colors"
          >
            <CreditCard className="w-4 h-4" strokeWidth={1.5} />
            Nâng cấp gói
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {params.registered && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
            Đăng ký thành công! Admin sẽ duyệt hồ sơ trong 1–2 ngày làm việc.
          </div>
        )}
        {!agency.verified && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            Sàn của bạn đang chờ admin duyệt. Sau khi duyệt, bạn có thể thêm nhân viên và đăng ký gói.
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: Users, label: 'Nhân viên', value: agency.agents_count ?? 0 },
            { icon: TrendingUp, label: 'Lead tháng này', value: monthlyLeads },
            { icon: Building2, label: 'Thành lập', value: fmtDate(agency.created_at) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-[#1565FF]" strokeWidth={1.5} />
                <span className="text-xs text-[#64748B]">{label}</span>
              </div>
              <div className="text-xl font-bold text-[#0D1B3D]">{value}</div>
            </div>
          ))}
        </div>

        {/* Team */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
            <h2 className="font-semibold text-[#0D1B3D] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1565FF]" strokeWidth={1.5} /> Đội nhóm
            </h2>
            {isPaid && agency.verified && (
              <div className="relative">
                <InviteAgentForm />
              </div>
            )}
          </div>

          {!isPaid && agency.verified && (
            <div className="px-5 py-4 text-sm text-[#64748B] text-center">
              <Link href="/dashboard/san/billing" className="text-[#1565FF] font-medium hover:underline">Đăng ký gói</Link> để thêm nhân viên
            </div>
          )}

          {(!agents || agents.length === 0) ? (
            <div className="px-5 py-8 text-center text-sm text-[#94A3B8]">Chưa có nhân viên nào</div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {agents.map(agent => (
                <div key={agent.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-9 h-9 rounded-full bg-[#F1F5F9] flex items-center justify-center shrink-0 overflow-hidden">
                    {agent.avatar_url
                      ? <img src={agent.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-sm font-medium text-[#64748B]">{(agent.display_name ?? 'N')[0]}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium text-[#0D1B3D]">{agent.display_name}</span>
                      {agent.kyc_status === 'approved' && (
                        <BadgeCheck className="w-3.5 h-3.5 text-[#1565FF]" strokeWidth={2.5} />
                      )}
                      {(agent.specialty_types ?? []).map((s: string) => (
                        <span key={s} className="text-xs text-[#64748B]">{SPECIALTY_LABEL[s] ?? s}</span>
                      ))}
                    </div>
                    <div className="text-xs text-[#94A3B8] mt-0.5">
                      {agent.leads_received_count ?? 0} leads · {agent.deals_closed_count ?? 0} deals
                      {agent.avg_rating ? ` · ⭐ ${Number(agent.avg_rating).toFixed(1)}` : ''}
                    </div>
                  </div>
                  <RemoveAgentButton agentId={agent.id} agentName={agent.display_name ?? ''} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
