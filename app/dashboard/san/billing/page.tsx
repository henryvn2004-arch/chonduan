import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Check, BadgeCheck, Sparkles, Clock } from 'lucide-react'
import SubscribeAgencyButton from './SubscribeAgencyButton'
import CancelAgencyButton from './CancelAgencyButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Gói Sàn — ChonDuan' }

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  APPROVAL_PENDING: 'Chờ xác nhận',
  CANCELLED: 'Đã huỷ',
  SUSPENDED: 'Tạm ngưng',
  EXPIRED: 'Hết hạn',
}
const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  APPROVAL_PENDING: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
  SUSPENDED: 'bg-red-100 text-red-600',
  EXPIRED: 'bg-gray-100 text-gray-600',
}

const PLANS = [
  {
    tier: 'basic' as const,
    name: 'Basic',
    price: '$99',
    agents: 10,
    features: [
      'Tối đa 10 nhân viên',
      'Tất cả nhân viên được hưởng badge Verified',
      'Dashboard team analytics',
      'Billing gộp 1 hoá đơn',
      'Email hỗ trợ',
    ],
  },
  {
    tier: 'pro' as const,
    name: 'Pro',
    price: '$299',
    agents: 30,
    features: [
      'Tối đa 30 nhân viên',
      'Tất cả tính năng Basic',
      'Priority support',
      'Branding sàn trên profile môi giới',
      'Export báo cáo hàng tháng',
    ],
  },
]

export default async function SanBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cancelled?: string; tier?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dang-nhap?next=/dashboard/san/billing')

  const { data: profile } = await supabase
    .from('user_profiles').select('user_type').eq('id', user.id).single()
  if (profile?.user_type !== 'agency_admin') redirect('/dang-ky/san')

  const service = await createServiceClient()
  const { data: agency } = await service
    .from('agencies')
    .select('id, name, verified, subscription_tier, agency_subscription_status, agency_subscription_tier, subscription_expires_at')
    .eq('admin_user_id', user.id)
    .single()

  if (!agency) redirect('/dang-ky/san')
  if (!agency.verified) redirect('/dashboard/san')

  const isActive = agency.agency_subscription_status === 'ACTIVE'
  const isPending = agency.agency_subscription_status === 'APPROVAL_PENDING'

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-4">
        <Link href="/dashboard/san" className="text-xs text-[#64748B] hover:text-[#1565FF] mb-1 block">
          ← Dashboard Sàn
        </Link>
        <h1 className="text-lg font-bold text-[#0D1B3D]">Gói dịch vụ</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {params.success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 font-medium">
            <Sparkles className="w-4 h-4 shrink-0" />
            Đăng ký thành công! Gói {params.tier?.toUpperCase()} sẽ kích hoạt sau vài phút.
          </div>
        )}
        {params.cancelled && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            Giao dịch đã bị huỷ. Bạn có thể thử lại bất cứ lúc nào.
          </div>
        )}

        {/* Current status */}
        {agency.agency_subscription_status && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[#0D1B3D]">
                  Gói hiện tại: {agency.agency_subscription_tier?.toUpperCase() ?? 'Free'}
                </div>
                {agency.subscription_expires_at && (
                  <div className="text-xs text-[#64748B] mt-0.5">
                    Gia hạn trước {new Date(agency.subscription_expires_at).toLocaleDateString('vi-VN')}
                  </div>
                )}
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[agency.agency_subscription_status] ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABEL[agency.agency_subscription_status] ?? agency.agency_subscription_status}
              </span>
            </div>
            {isPending && (
              <div className="mt-3 flex items-center gap-2 text-xs text-yellow-700">
                <Clock className="w-3.5 h-3.5" /> Đang chờ PayPal xác nhận...
              </div>
            )}
            {isActive && (
              <div className="mt-3 flex justify-end">
                <CancelAgencyButton />
              </div>
            )}
          </div>
        )}

        {/* Plans */}
        {!isActive && !isPending && (
          <div className="grid sm:grid-cols-2 gap-4">
            {PLANS.map(plan => (
              <div key={plan.tier} className={`bg-white rounded-2xl border p-5 flex flex-col ${plan.tier === 'pro' ? 'border-[#1565FF] ring-1 ring-[#1565FF]/20' : 'border-[#E2E8F0]'}`}>
                {plan.tier === 'pro' && (
                  <div className="text-xs font-semibold text-[#1565FF] mb-2">PHỔ BIẾN NHẤT</div>
                )}
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-bold text-[#0D1B3D]">{plan.price}</span>
                  <span className="text-sm text-[#64748B]">/tháng</span>
                </div>
                <div className="text-sm font-semibold text-[#0D1B3D] mb-3">{plan.name} — tối đa {plan.agents} nhân viên</div>
                <ul className="space-y-2 mb-5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#374151]">
                      <Check className="w-4 h-4 text-[#1565FF] mt-0.5 shrink-0" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <SubscribeAgencyButton tier={plan.tier} label={`Đăng ký ${plan.name} — ${plan.price}/tháng`} />
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 text-xs text-[#64748B] space-y-2">
          <p className="font-semibold text-[#0D1B3D] mb-2">Câu hỏi thường gặp</p>
          <p><span className="font-medium text-[#374151]">Nhân viên được hưởng gì?</span><br />Tất cả nhân viên trong sàn được hưởng badge Verified + tính năng Pro mà không cần đăng ký riêng.</p>
          <p><span className="font-medium text-[#374151]">Huỷ thì sao?</span><br />Gói bị xoá ngay lập tức. Nhân viên mất quyền truy cập tính năng Pro.</p>
          <p><span className="font-medium text-[#374151]">Thanh toán thế nào?</span><br />Qua PayPal, tự động gia hạn hàng tháng. Một hoá đơn cho toàn bộ sàn.</p>
        </div>
      </main>
    </div>
  )
}
