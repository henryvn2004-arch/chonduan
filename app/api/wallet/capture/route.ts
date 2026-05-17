import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/payments/paypal'

// GET /api/wallet/capture?payment_id=...&token=...
// PayPal redirects here after user approves payment
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const paymentId = searchParams.get('payment_id')
  const paypalToken = searchParams.get('token') // PayPal order ID

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://phaplyduan.vn'

  if (!paymentId) {
    return NextResponse.redirect(`${appUrl}/dashboard/moi-gioi/nap-tien?error=invalid`)
  }

  const supabase = await createClient()

  const { data: payment } = await supabase
    .from('payments')
    .select('id, status, payer_id, credits_awarded, amount_vnd, method, external_order_id')
    .eq('id', paymentId)
    .single()

  if (!payment) {
    return NextResponse.redirect(`${appUrl}/dashboard/moi-gioi/nap-tien?error=notfound`)
  }

  // Idempotent: already completed
  if (payment.status === 'completed') {
    return NextResponse.redirect(`${appUrl}/dashboard/moi-gioi/nap-tien?success=1`)
  }

  if (payment.status !== 'pending') {
    return NextResponse.redirect(`${appUrl}/dashboard/moi-gioi/nap-tien?error=invalid`)
  }

  try {
    if (payment.method === 'paypal') {
      const orderId = paypalToken ?? payment.external_order_id
      const { status } = await capturePayPalOrder(orderId)
      if (status !== 'COMPLETED') throw new Error(`PayPal status: ${status}`)
    }
    // payOS completion is handled by webhook; this route just redirects after QR scan
    // but we also credit here if payOS sends status=PAID in query params
    if (payment.method === 'payos') {
      const status = searchParams.get('status')
      if (status !== 'PAID') {
        return NextResponse.redirect(`${appUrl}/dashboard/moi-gioi/nap-tien?cancelled=1`)
      }
    }

    await creditWallet(supabase, payment)
    return NextResponse.redirect(`${appUrl}/dashboard/moi-gioi/nap-tien?success=1`)
  } catch {
    await supabase.from('payments').update({ status: 'failed' }).eq('id', paymentId)
    return NextResponse.redirect(`${appUrl}/dashboard/moi-gioi/nap-tien?error=failed`)
  }
}

export async function creditWallet(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  payment: { id: string; payer_id: string; credits_awarded: number | null; amount_vnd: number }
) {
  const credits = payment.credits_awarded ?? 0

  const { data: wallet } = await supabase
    .from('wallets')
    .select('id, balance_credits, total_topped_up_credits')
    .eq('owner_type', 'agent')
    .eq('owner_id', payment.payer_id)
    .single()

  if (!wallet) throw new Error('Wallet not found')

  await supabase.from('wallets').update({
    balance_credits: wallet.balance_credits + credits,
    total_topped_up_credits: wallet.total_topped_up_credits + credits,
    updated_at: new Date().toISOString(),
  }).eq('id', wallet.id)

  await supabase.from('wallet_transactions').insert({
    wallet_id: wallet.id,
    type: 'topup',
    amount_credits: credits,
    balance_after_credits: wallet.balance_credits + credits,
    reference_id: payment.id,
    reference_type: 'payment',
    notes: `Nạp tiền — ${credits} credits`,
  })

  await supabase.from('payments').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
  }).eq('id', payment.id)
}
