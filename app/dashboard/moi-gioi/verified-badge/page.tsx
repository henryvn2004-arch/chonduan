import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BadgeCheck, Circle, Sparkles, Clock, Check } from 'lucide-react'
import SubscribeButton from './SubscribeButton'
import CancelButton from './CancelButton'

export const metadata = { title: 'Verified Badge — ChonDuAn' }

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  APPROVAL_PENDING: 'Chờ xác nhận',
  CANCELLED: 'Đã hủy',
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

export default async function VerifiedBadgePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cancelled?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dang-nhap?next=/dashboard/moi-gioi/verified-badge')

  const { data: agent } = await supabase
    .from('agents')
    .select('id, display_name, kyc_status, verified_badge_active, subscription_id, subscription_status, subscription_plan, verified_badge_expires_at')
    .eq('user_id', user.id)
    .single()

  if (!agent) redirect('/dang-ky/moi-gioi')
  if (agent.kyc_status !== 'approved') redirect('/dashboard/moi-gioi')

  const isActive = agent.subscription_status === 'ACTIVE' && agent.verified_badge_active
  const isPending = agent.subscription_status === 'APPROVAL_PENDING'

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-4">
        <Link href="/dashboard/moi-gioi" className="text-xs text-[#64748B] hover:text-[#1565FF] mb-1 block">
          ← Dashboard
        </Link>
        <h1 className="text-lg font-bold text-[#0D1B3D]">Huy hiệu Verified</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Alerts */}
        {params.success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 font-medium">
            <Sparkles className="w-4 h-4 shrink-0" strokeWidth={2} />
            Đăng ký thành công! Huy hiệu Verified sẽ được kích hoạt sau vài phút.
          </div>
        )}
        {params.cancelled && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            Giao dịch đã bị hủy. Bạn có thể thử lại bất cứ lúc nào.
          </div>
        )}

        {/* Current status */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? 'bg-blue-50 text-[#1565FF]' : 'bg-gray-100 text-[#94A3B8]'}`}>
                {isActive ? <BadgeCheck className="w-6 h-6" strokeWidth={2} /> : <Circle className="w-6 h-6" strokeWidth={2} />}
              </div>
              <div>
                <div className="font-semibold text-[#0D1B3D]">{agent.display_name}</div>
                <div className="text-xs text-[#64748B]">Môi giới đã xác minh KYC</div>
              </div>
            </div>
            {agent.subscription_status && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[agent.subscription_status] ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABEL[agent.subscription_status] ?? agent.subscription_status}
              </span>
            )}
          </div>

          {isActive && agent.verified_badge_expires_at && (
            <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
              <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />
              <span className="font-medium">Verified đang hoạt động</span>
              <span className="text-blue-500 ml-2 text-xs">
                Gia hạn trước {new Date(agent.verified_badge_expires_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
          )}
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <h2 className="flex items-center gap-2 font-semibold text-[#0D1B3D] mb-4">
            <BadgeCheck className="w-5 h-5 text-[#1565FF]" strokeWidth={2} />
            Lợi ích Verified Badge
          </h2>
          <ul className="space-y-3 text-sm text-[#374151]">
            {[
              'Huy hiệu xanh nổi bật trên profile và trong danh sách môi giới',
              'Ưu tiên hiển thị cao hơn trong cùng slot rank',
              'Khách hàng tin tưởng hơn — tăng tỷ lệ chuyển đổi lead',
              'Badge Verified Agent trên trang dự án bên cạnh tên',
              'Tự động gia hạn mỗi tháng — không gián đoạn',
            ].map((benefit, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#1565FF] mt-0.5 shrink-0" strokeWidth={2.5} />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing + action */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-bold text-[#0D1B3D]">$5</span>
            <span className="text-[#64748B] text-sm">/tháng</span>
          </div>
          <p className="text-xs text-[#94A3B8] mb-5">
            Thanh toán qua PayPal · Hủy bất cứ lúc nào · Tự động gia hạn
          </p>

          {isActive ? (
            <div className="space-y-3">
              <div className="w-full flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 font-semibold py-3 rounded-xl text-sm">
                <BadgeCheck className="w-4 h-4" strokeWidth={2.5} /> Đang hoạt động
              </div>
              <div className="text-center">
                <CancelButton />
              </div>
            </div>
          ) : isPending ? (
            <div className="w-full flex items-center justify-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 font-semibold py-3 rounded-xl text-sm">
              <Clock className="w-4 h-4" strokeWidth={2} /> Chờ xác nhận từ PayPal...
            </div>
          ) : (
            <SubscribeButton />
          )}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 text-xs text-[#64748B] space-y-2">
          <p className="font-semibold text-[#0D1B3D] mb-2">Câu hỏi thường gặp</p>
          <p><span className="font-medium text-[#374151]">Huy hiệu kích hoạt khi nào?</span><br />Trong vòng 5 phút sau khi PayPal xác nhận thanh toán.</p>
          <p><span className="font-medium text-[#374151]">Hủy thì sao?</span><br />Huy hiệu bị xóa ngay lập tức. Không hoàn tiền phần còn lại của tháng.</p>
          <p><span className="font-medium text-[#374151]">Thanh toán qua PayPal?</span><br />Có. Hỗ trợ thẻ tín dụng/ghi nợ và tài khoản PayPal.</p>
        </div>
      </main>
    </div>
  )
}
