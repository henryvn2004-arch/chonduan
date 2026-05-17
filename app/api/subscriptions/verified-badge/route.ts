import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createSubscription, cancelSubscription } from '@/lib/payments/paypal-subscriptions'

const PLAN_ID = process.env.PAYPAL_VERIFIED_BADGE_PLAN_ID!
const BADGE_PRICE_USD = '5.00'

// POST /api/subscriptions/verified-badge
// Create a PayPal subscription for verified agent badge
export async function POST(req: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agent } = await supabase
    .from('agents')
    .select('id, kyc_status, is_verified, subscription_id, subscription_status')
    .eq('user_id', user.id)
    .single()

  if (!agent) return NextResponse.json({ error: 'Not an agent' }, { status: 403 })
  if (agent.kyc_status !== 'approved') return NextResponse.json({ error: 'KYC not approved' }, { status: 403 })
  if (agent.subscription_status === 'ACTIVE') {
    return NextResponse.json({ error: 'Bạn đã có gói Verified đang hoạt động' }, { status: 400 })
  }

  if (!PLAN_ID) {
    return NextResponse.json({ error: 'Verified badge plan not configured' }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://chonduan.vn'

  const { subscriptionId, approveUrl } = await createSubscription({
    planId: PLAN_ID,
    returnUrl: `${appUrl}/dashboard/moi-gioi/verified-badge?success=1`,
    cancelUrl: `${appUrl}/dashboard/moi-gioi/verified-badge?cancelled=1`,
    customId: agent.id,
  })

  // Save pending subscription
  await supabase.from('agents').update({
    subscription_id: subscriptionId,
    subscription_status: 'APPROVAL_PENDING',
    subscription_plan: 'verified_badge',
    subscription_price_usd: parseFloat(BADGE_PRICE_USD),
    verified_badge_active: false,
    updated_at: new Date().toISOString(),
  }).eq('id', agent.id)

  return NextResponse.json({ redirect_url: approveUrl })
}

// DELETE /api/subscriptions/verified-badge
// Cancel verified badge subscription
export async function DELETE() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agent } = await supabase
    .from('agents')
    .select('id, subscription_id, subscription_status')
    .eq('user_id', user.id)
    .single()

  if (!agent) return NextResponse.json({ error: 'Not an agent' }, { status: 403 })
  if (!agent.subscription_id) return NextResponse.json({ error: 'Không có subscription' }, { status: 400 })
  if (agent.subscription_status === 'CANCELLED') {
    return NextResponse.json({ error: 'Đã hủy trước đó' }, { status: 400 })
  }

  await cancelSubscription(agent.subscription_id, 'Cancelled by agent')

  await supabase.from('agents').update({
    subscription_status: 'CANCELLED',
    verified_badge_active: false,
    verified_badge_expires_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', agent.id)

  return NextResponse.json({ ok: true })
}
