import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createSubscription, cancelSubscription } from '@/lib/payments/paypal-subscriptions'

const PLAN_IDS: Record<string, string> = {
  basic: process.env.PAYPAL_AGENCY_BASIC_PLAN_ID ?? '',
  pro: process.env.PAYPAL_AGENCY_PRO_PLAN_ID ?? '',
}

const PRICES: Record<string, string> = { basic: '99.00', pro: '299.00' }

// POST /api/subscriptions/agency — create PayPal subscription for agency
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tier } = await req.json() // 'basic' | 'pro'
  if (!PLAN_IDS[tier]) {
    return NextResponse.json({ error: 'Tier không hợp lệ' }, { status: 400 })
  }
  if (!PLAN_IDS[tier]) {
    return NextResponse.json({ error: `Gói ${tier} chưa được cấu hình` }, { status: 500 })
  }

  const service = await createServiceClient()
  const { data: agency } = await service
    .from('agencies')
    .select('id, verified, agency_subscription_status')
    .eq('admin_user_id', user.id)
    .single()

  if (!agency) return NextResponse.json({ error: 'Không tìm thấy sàn' }, { status: 404 })
  if (!agency.verified) return NextResponse.json({ error: 'Sàn chưa được admin duyệt' }, { status: 403 })
  if (agency.agency_subscription_status === 'ACTIVE') {
    return NextResponse.json({ error: 'Sàn đã có gói đang hoạt động' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://chonduan.vn'
  const { subscriptionId, approveUrl } = await createSubscription({
    planId: PLAN_IDS[tier],
    returnUrl: `${appUrl}/dashboard/san/billing?success=1&tier=${tier}`,
    cancelUrl: `${appUrl}/dashboard/san/billing?cancelled=1`,
    customId: `agency:${agency.id}`,
  })

  await service.from('agencies').update({
    agency_subscription_id: subscriptionId,
    agency_subscription_status: 'APPROVAL_PENDING',
    agency_subscription_tier: tier,
    updated_at: new Date().toISOString(),
  }).eq('id', agency.id)

  return NextResponse.json({ redirect_url: approveUrl })
}

// DELETE /api/subscriptions/agency — cancel agency subscription
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = await createServiceClient()
  const { data: agency } = await service
    .from('agencies')
    .select('id, agency_subscription_id, agency_subscription_status')
    .eq('admin_user_id', user.id)
    .single()

  if (!agency) return NextResponse.json({ error: 'Không tìm thấy sàn' }, { status: 404 })
  if (!agency.agency_subscription_id) {
    return NextResponse.json({ error: 'Không có subscription' }, { status: 400 })
  }

  await cancelSubscription(agency.agency_subscription_id, 'Cancelled by agency admin')

  await service.from('agencies').update({
    agency_subscription_status: 'CANCELLED',
    subscription_tier: 'free',
    subscription_expires_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', agency.id)

  return NextResponse.json({ ok: true })
}
