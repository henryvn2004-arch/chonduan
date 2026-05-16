import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Bid Slot — ChonDuAn' }

export default async function BidPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dang-nhap?next=/dashboard/moi-gioi/bid')

  const { data: agent } = await supabase
    .from('agents')
    .select('id, kyc_status')
    .eq('user_id', user.id)
    .single()

  if (!agent) redirect('/dang-ky/moi-gioi')

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 max-w-md w-full text-center shadow-sm">
        <div className="text-4xl mb-4">🏗️</div>
        <h1 className="text-xl font-bold text-[#0D1B3D] mb-2">Bid Slot — Sắp ra mắt</h1>
        <p className="text-sm text-[#64748B] mb-6">
          Tính năng đấu thầu slot trực tuyến đang được phát triển.
          Liên hệ admin để bid thủ công trong thời gian chờ.
        </p>
        <Link
          href="/dashboard/moi-gioi"
          className="inline-block bg-[#1565FF] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0D4FCC] transition-colors"
        >
          Về Dashboard
        </Link>
      </div>
    </div>
  )
}
