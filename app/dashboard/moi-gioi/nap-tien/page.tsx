import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TopupForm from './TopupForm'

export const metadata = { title: 'Nạp Credits — PhaplyDuan' }

export default async function TopupPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cancelled?: string; error?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dang-nhap?next=/dashboard/moi-gioi/nap-tien')

  const { data: agent } = await supabase
    .from('agents')
    .select('id, kyc_status')
    .eq('user_id', user.id)
    .single()

  if (!agent || agent.kyc_status !== 'approved') redirect('/dashboard/moi-gioi')

  const [{ data: wallet }, { data: packages }, { data: history }] = await Promise.all([
    supabase
      .from('wallets')
      .select('balance_credits, total_topped_up_credits, total_spent_credits')
      .eq('owner_type', 'agent')
      .eq('owner_id', agent.id)
      .single(),
    supabase
      .from('credit_packages')
      .select('id, name, credits, bonus_credits, price_vnd')
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('wallet_transactions')
      .select('id, type, amount_credits, balance_after_credits, notes, created_at')
      .eq('wallet_id',
        (await supabase.from('wallets').select('id').eq('owner_type', 'agent').eq('owner_id', agent.id).single()).data?.id ?? ''
      )
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const balance = wallet?.balance_credits ?? 0

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-4">
        <Link href="/dashboard/moi-gioi" className="text-xs text-[#64748B] hover:text-[#1565FF] mb-1 block">← Dashboard</Link>
        <h1 className="text-lg font-bold text-[#0D1B3D]">Nạp Credits</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Status alerts */}
        {params.success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 font-medium">
            Nạp tiền thành công! Credits đã được cộng vào ví.
          </div>
        )}
        {params.cancelled && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            Giao dịch đã bị hủy.
          </div>
        )}
        {params.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            Giao dịch thất bại. Vui lòng thử lại hoặc liên hệ hỗ trợ.
          </div>
        )}

        {/* Wallet summary */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#64748B] mb-1">Số dư hiện tại</div>
              <div className="text-3xl font-bold text-[#0D1B3D]">
                {balance.toLocaleString()} <span className="text-lg font-normal text-[#64748B]">Cr</span>
              </div>
              <div className="text-xs text-[#94A3B8] mt-0.5">
                ≈ {(balance * 1000).toLocaleString('vi-VN')} VND
              </div>
            </div>
            <div className="text-right text-xs text-[#94A3B8] space-y-1">
              <div>Đã nạp: {(wallet?.total_topped_up_credits ?? 0).toLocaleString()} Cr</div>
              <div>Đã chi: {(wallet?.total_spent_credits ?? 0).toLocaleString()} Cr</div>
            </div>
          </div>
        </div>

        {/* Topup form */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <TopupForm packages={packages ?? []} />
        </div>

        {/* Transaction history */}
        {(history ?? []).length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
            <h2 className="font-semibold text-[#0D1B3D] mb-3 text-sm">Lịch sử giao dịch</h2>
            <div className="space-y-2">
              {(history ?? []).map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
                  <div>
                    <div className="text-sm text-[#0D1B3D]">
                      {tx.type === 'topup' ? '↑ Nạp tiền' :
                       tx.type === 'lead_charge' ? '↓ Lead charge' :
                       tx.type === 'bid_charge' ? '↓ Bid tuần' :
                       tx.type === 'refund' ? '↑ Hoàn tiền' :
                       tx.type === 'feature_charge' ? '↓ Featured video' :
                       tx.type === 'boost_charge' ? '↓ Boost bài viết' : tx.type}
                    </div>
                    {tx.notes && <div className="text-xs text-[#94A3B8]">{tx.notes}</div>}
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${tx.amount_credits > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.amount_credits > 0 ? '+' : ''}{tx.amount_credits} Cr
                    </div>
                    <div className="text-[10px] text-[#94A3B8]">
                      {new Date(tx.created_at).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
