import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RefundLeadButton from './RefundLeadButton'
import FlagLeadButton from './FlagLeadButton'

export const metadata = { title: 'Admin — Leads' }

const STATUS_LABEL: Record<string, string> = {
  new: 'Mới',
  contacted: 'Đã liên hệ',
  qualified: 'Tiềm năng',
  converted: 'Thành công',
  lost: 'Không thành',
  refunded: 'Đã hoàn',
  flagged: 'Nghi ngờ',
}

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700',
  contacted: 'bg-gray-100 text-gray-600',
  qualified: 'bg-yellow-50 text-yellow-700',
  converted: 'bg-green-50 text-green-700',
  lost: 'bg-red-50 text-red-600',
  refunded: 'bg-purple-50 text-purple-700',
  flagged: 'bg-orange-50 text-orange-700',
}

const TYPE_LABEL: Record<string, string> = {
  sale: '🏠 Sale',
  rent_long: '🔑 Thuê dài',
  rent_short: '🏨 Thuê ngắn',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dang-nhap')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profile?.user_type !== 'admin') redirect('/')

  let query = supabase
    .from('leads')
    .select(`
      id, contact_name, contact_phone, contact_email,
      transaction_type, status, is_verified, credits_charged,
      message, created_at, refund_reason,
      projects(name_official, province),
      agents(display_name, slug)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (params.status) {
    query = query.eq('status', params.status as string)
  }

  const { data: leads } = await query

  const stats = {
    total: leads?.length ?? 0,
    flagged: leads?.filter(l => l.status === 'flagged').length ?? 0,
    refunded: leads?.filter(l => l.status === 'refunded').length ?? 0,
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <Link href="/dashboard/admin" className="text-xs text-[#64748B] hover:text-[#1565FF] mb-1 block">
            ← Admin
          </Link>
          <h1 className="text-xl font-bold text-[#0D1B3D]">Leads</h1>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#64748B]">
          <span>{stats.total} leads</span>
          {stats.flagged > 0 && (
            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
              {stats.flagged} nghi ngờ
            </span>
          )}
          {stats.refunded > 0 && (
            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
              {stats.refunded} đã hoàn
            </span>
          )}
        </div>
      </header>

      {/* Filter tabs */}
      <div className="bg-white border-b border-gray-100 px-6 flex gap-1 overflow-x-auto">
        {[
          { label: 'Tất cả', value: '' },
          { label: 'Mới', value: 'new' },
          { label: 'Nghi ngờ', value: 'flagged' },
          { label: 'Đã hoàn', value: 'refunded' },
          { label: 'Thành công', value: 'converted' },
        ].map(tab => (
          <Link
            key={tab.value}
            href={tab.value ? `/dashboard/admin/leads?status=${tab.value}` : '/dashboard/admin/leads'}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              (params.status ?? '') === tab.value
                ? 'border-[#1565FF] text-[#1565FF]'
                : 'border-transparent text-[#64748B] hover:text-[#0D1B3D]'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-[#8A94A6]">Khách hàng</th>
                <th className="text-left px-4 py-3 font-medium text-[#8A94A6]">Dự án / Môi giới</th>
                <th className="text-left px-4 py-3 font-medium text-[#8A94A6]">Loại</th>
                <th className="text-left px-4 py-3 font-medium text-[#8A94A6]">Cr charged</th>
                <th className="text-left px-4 py-3 font-medium text-[#8A94A6]">Trạng thái</th>
                <th className="text-left px-4 py-3 font-medium text-[#8A94A6]">Ngày</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(leads ?? []).map(lead => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const proj = (lead as any).projects
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const agent = (lead as any).agents
                const canRefund = !['refunded', 'converted'].includes(lead.status) && (lead.credits_charged ?? 0) > 0
                const canFlag = !['refunded', 'flagged'].includes(lead.status)

                return (
                  <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#0D1B3D]">{lead.contact_name}</div>
                      <a href={`tel:${lead.contact_phone}`} className="text-xs text-[#1565FF] hover:underline">
                        {lead.contact_phone}
                      </a>
                      {lead.contact_email && (
                        <div className="text-xs text-[#94A3B8]">{lead.contact_email}</div>
                      )}
                      {!lead.is_verified && (
                        <span className="text-[10px] text-[#94A3B8]">anonymous</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-[#0D1B3D] truncate max-w-[180px]">
                        {proj?.name_official ?? '—'}
                      </div>
                      {agent && (
                        <Link
                          href={`/moi-gioi/${agent.slug}`}
                          className="text-xs text-[#1565FF] hover:underline"
                        >
                          {agent.display_name}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs">{TYPE_LABEL[lead.transaction_type] ?? lead.transaction_type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-[#0D1B3D]">
                        {(lead.credits_charged ?? 0) > 0 ? `${lead.credits_charged} Cr` : 'Free'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[lead.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[lead.status] ?? lead.status}
                      </span>
                      {lead.refund_reason && (
                        <div className="text-[10px] text-[#94A3B8] mt-0.5 max-w-[120px] truncate" title={lead.refund_reason}>
                          {lead.refund_reason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#94A3B8]">
                      {fmtDate(lead.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {canFlag && <FlagLeadButton leadId={lead.id} />}
                        {canRefund && (
                          <RefundLeadButton
                            leadId={lead.id}
                            credits={lead.credits_charged ?? 0}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {(leads ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#8A94A6] text-sm">
                    Không có leads nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
