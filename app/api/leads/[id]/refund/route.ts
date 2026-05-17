import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/leads/[id]/refund
// Admin only — refund credits to agent's wallet
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profile?.user_type !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { reason } = await req.json()
  if (!reason?.trim()) {
    return NextResponse.json({ error: 'Lý do hoàn tiền là bắt buộc' }, { status: 400 })
  }

  // Get lead with credits info
  const { data: lead } = await supabase
    .from('leads')
    .select('id, agent_id, status, credits_charged')
    .eq('id', id)
    .single()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (lead.status === 'refunded') return NextResponse.json({ error: 'Đã hoàn trước đó' }, { status: 400 })
  if (lead.status === 'converted') return NextResponse.json({ error: 'Không hoàn lead đã thành công' }, { status: 400 })

  const creditsToRefund = lead.credits_charged ?? 0

  // Refund to agent's wallet if there were credits charged
  if (creditsToRefund > 0) {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance_credits, total_spent_credits')
      .eq('owner_type', 'agent')
      .eq('owner_id', lead.agent_id)
      .single()

    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })

    const { error: walletErr } = await supabase
      .from('wallets')
      .update({
        balance_credits: wallet.balance_credits + creditsToRefund,
        total_spent_credits: Math.max(0, wallet.total_spent_credits - creditsToRefund),
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id)

    if (walletErr) return NextResponse.json({ error: walletErr.message }, { status: 500 })

    await supabase.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      type: 'refund',
      amount_credits: creditsToRefund,
      balance_after_credits: wallet.balance_credits + creditsToRefund,
      reference_id: lead.id,
      reference_type: 'lead',
      notes: `Hoàn tiền lead — ${reason}`,
    })
  }

  // Mark lead as refunded
  const { error } = await supabase
    .from('leads')
    .update({
      status: 'refunded',
      refund_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    credits_refunded: creditsToRefund,
  })
}
