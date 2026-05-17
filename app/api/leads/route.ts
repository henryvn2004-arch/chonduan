import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Credits charged per lead (after 5 free leads/month)
const LEAD_COST: Record<string, { verified: number; anonymous: number }> = {
  sale:       { verified: 200, anonymous: 50 },
  rent_long:  { verified: 80,  anonymous: 20 },
  rent_short: { verified: 30,  anonymous: 30 },
}
const FREE_LEADS_PER_MONTH = 5

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      agent_id, project_id,
      transaction_type = 'sale',
      contact_name, contact_phone, contact_email, message,
      preferred_bedrooms, budget_monthly_vnd, budget_total_vnd,
      preferred_move_in_date, needs_furnished,
    } = body

    if (!contact_name || !contact_phone) {
      return NextResponse.json({ error: 'Thiếu tên hoặc số điện thoại' }, { status: 400 })
    }
    if (!agent_id) {
      return NextResponse.json({ error: 'Thiếu agent_id' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const isVerified = !!user

    // Count agent's leads this month to check free quota
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { count: leadsThisMonth } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agent_id)
      .gte('created_at', monthStart.toISOString())

    const usedFree = leadsThisMonth ?? 0
    const isFree = usedFree < FREE_LEADS_PER_MONTH

    let creditsCharged = 0
    if (!isFree) {
      const pricing = LEAD_COST[transaction_type] ?? LEAD_COST.sale
      creditsCharged = isVerified ? pricing.verified : pricing.anonymous

      // Check wallet balance and deduct
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id, balance_credits, total_spent_credits')
        .eq('owner_type', 'agent')
        .eq('owner_id', agent_id)
        .single()

      if (!wallet || wallet.balance_credits < creditsCharged) {
        return NextResponse.json({ error: 'Agent không đủ credits' }, { status: 402 })
      }

      // Deduct credits atomically
      const { error: walletErr } = await supabase
        .from('wallets')
        .update({
          balance_credits: wallet.balance_credits - creditsCharged,
          total_spent_credits: wallet.total_spent_credits + creditsCharged,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet.id)

      if (walletErr) throw new Error(walletErr.message)

      // Log transaction
      await supabase.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        type: 'lead_charge',
        amount_credits: -creditsCharged,
        balance_after_credits: wallet.balance_credits - creditsCharged,
        notes: `Lead ${transaction_type} — ${isVerified ? 'verified' : 'anonymous'}`,
      })
    }

    const { data, error } = await supabase.from('leads').insert({
      agent_id,
      project_id: project_id ?? null,
      user_id: user?.id ?? null,
      transaction_type,
      contact_name,
      contact_phone,
      contact_email: contact_email ?? null,
      message: message ?? null,
      preferred_bedrooms: preferred_bedrooms ?? null,
      budget_monthly_vnd: budget_monthly_vnd ?? null,
      budget_total_vnd: budget_total_vnd ?? null,
      preferred_move_in_date: preferred_move_in_date ?? null,
      needs_furnished: needs_furnished ?? null,
      is_verified: isVerified,
      source_url: req.headers.get('referer') ?? null,
      status: 'new',
    }).select('id').single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ id: data.id, credits_charged: creditsCharged, is_free: isFree }, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Lỗi server' }, { status: 500 })
  }
}
