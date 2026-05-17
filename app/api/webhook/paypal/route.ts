import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { verifyPayPalWebhook } from '@/lib/payments/paypal'
import { creditWallet } from '@/app/api/wallet/capture/route'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const headers: Record<string, string> = {}
  req.headers.forEach((v, k) => { headers[k] = v })

  const webhookId = process.env.PAYPAL_WEBHOOK_ID!
  const valid = await verifyPayPalWebhook({ headers, rawBody, webhookId })
  if (!valid) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })

  const event = JSON.parse(rawBody)
  if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
    return NextResponse.json({ ok: true }) // ignore other events
  }

  const paypalOrderId = event.resource?.supplementary_data?.related_ids?.order_id
    ?? event.resource?.id
  if (!paypalOrderId) return NextResponse.json({ ok: true })

  const supabase = await createClient()
  const { data: payment } = await supabase
    .from('payments')
    .select('id, status, payer_id, credits_awarded, amount_vnd, method')
    .eq('external_order_id', paypalOrderId)
    .single()

  if (!payment || payment.status === 'completed') {
    return NextResponse.json({ ok: true }) // idempotent
  }

  await creditWallet(supabase, payment)
  return NextResponse.json({ ok: true })
}
