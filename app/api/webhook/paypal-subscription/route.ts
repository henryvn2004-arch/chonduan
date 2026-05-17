import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { verifySubscriptionWebhook } from '@/lib/payments/paypal-subscriptions'

// POST /api/webhook/paypal-subscription
// Handles PayPal Subscription lifecycle events
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const headers: Record<string, string> = {}
  req.headers.forEach((v, k) => { headers[k] = v })

  const { valid, eventType, subscriptionId, status } = await verifySubscriptionWebhook({
    headers,
    rawBody,
  })

  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (!subscriptionId) return NextResponse.json({ ok: true })

  const supabase = await createClient()

  // Map PayPal status to our DB status
  // Events we care about:
  // BILLING.SUBSCRIPTION.ACTIVATED → subscription active → grant badge
  // BILLING.SUBSCRIPTION.CANCELLED → cancelled → revoke badge
  // BILLING.SUBSCRIPTION.SUSPENDED → payment failed → revoke badge
  // BILLING.SUBSCRIPTION.EXPIRED   → revoke badge
  // PAYMENT.SALE.COMPLETED         → recurring payment ok → extend badge

  const grantBadgeEvents = new Set([
    'BILLING.SUBSCRIPTION.ACTIVATED',
    'PAYMENT.SALE.COMPLETED',
  ])
  const revokeBadgeEvents = new Set([
    'BILLING.SUBSCRIPTION.CANCELLED',
    'BILLING.SUBSCRIPTION.SUSPENDED',
    'BILLING.SUBSCRIPTION.EXPIRED',
  ])

  if (grantBadgeEvents.has(eventType)) {
    // Grant verified badge — find agent by subscription_id
    const nextExpiry = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString() // +35 days buffer

    await supabase
      .from('agents')
      .update({
        subscription_status: status || 'ACTIVE',
        verified_badge_active: true,
        verified_badge_expires_at: nextExpiry,
        updated_at: new Date().toISOString(),
      })
      .eq('subscription_id', subscriptionId)

  } else if (revokeBadgeEvents.has(eventType)) {
    // Revoke badge
    await supabase
      .from('agents')
      .update({
        subscription_status: status || 'CANCELLED',
        verified_badge_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('subscription_id', subscriptionId)
  }

  return NextResponse.json({ ok: true })
}
