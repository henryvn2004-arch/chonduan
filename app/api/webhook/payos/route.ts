import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { verifyPayOSWebhook } from '@/lib/payments/payos'
import { creditWallet } from '@/app/api/wallet/capture/route'

export async function POST(req: NextRequest) {
  const payload = await req.json()

  const checksumKey = process.env.PAYOS_CHECKSUM_KEY!
  if (!verifyPayOSWebhook(payload, checksumKey)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // payOS sends code '00' for success
  if (payload.code !== '00') return NextResponse.json({ ok: true })

  const paymentLinkId = payload.data?.paymentLinkId
  if (!paymentLinkId) return NextResponse.json({ ok: true })

  const supabase = await createClient()
  const { data: payment } = await supabase
    .from('payments')
    .select('id, status, payer_id, credits_awarded, amount_vnd, method')
    .eq('external_order_id', paymentLinkId)
    .single()

  if (!payment || payment.status === 'completed') {
    return NextResponse.json({ ok: true }) // idempotent
  }

  await creditWallet(supabase, payment)
  return NextResponse.json({ code: '00', desc: 'success' })
}
