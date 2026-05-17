import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createPayPalOrder } from '@/lib/payments/paypal'
import { createPayOSLink } from '@/lib/payments/payos'

// POST /api/wallet/topup
// Body: { package_id, method: 'paypal' | 'payos' }
export async function POST(req: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agent } = await supabase
    .from('agents')
    .select('id, kyc_status')
    .eq('user_id', user.id)
    .single()

  if (!agent || agent.kyc_status !== 'approved') {
    return NextResponse.json({ error: 'Agent not approved' }, { status: 403 })
  }

  const { package_id, method } = await req.json()
  if (!package_id || !method) {
    return NextResponse.json({ error: 'Missing package_id or method' }, { status: 400 })
  }
  if (!['paypal', 'payos'].includes(method)) {
    return NextResponse.json({ error: 'Invalid method' }, { status: 400 })
  }

  const { data: pkg } = await supabase
    .from('credit_packages')
    .select('id, name, credits, bonus_credits, price_vnd')
    .eq('id', package_id)
    .eq('is_active', true)
    .single()

  if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 })

  const totalCredits = pkg.credits + pkg.bonus_credits
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://chonduan.vn'

  // Create pending payment record first
  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .insert({
      payer_type: 'agent',
      payer_id: agent.id,
      amount_vnd: pkg.price_vnd,
      method,
      status: 'pending',
      wallet_topup: true,
      credit_package_id: pkg.id,
      credits_awarded: totalCredits,
      metadata: { package_name: pkg.name, credits: pkg.credits, bonus: pkg.bonus_credits },
    })
    .select('id')
    .single()

  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 })

  const returnUrl = `${appUrl}/api/wallet/capture?payment_id=${payment.id}`
  const cancelUrl = `${appUrl}/dashboard/moi-gioi/nap-tien?cancelled=1`

  try {
    if (method === 'paypal') {
      const { orderId, approveUrl } = await createPayPalOrder({
        amountVnd: pkg.price_vnd,
        packageName: pkg.name,
        returnUrl,
        cancelUrl,
        internalOrderId: payment.id,
      })
      await supabase.from('payments').update({ external_order_id: orderId }).eq('id', payment.id)
      return NextResponse.json({ redirect_url: approveUrl })
    } else {
      // payOS uses numeric order code — take last 8 digits of payment UUID as int
      const orderCode = parseInt(payment.id.replace(/-/g, '').slice(-8), 16) % 9_999_999
      const { checkoutUrl, paymentLinkId } = await createPayOSLink({
        orderCode,
        amountVnd: pkg.price_vnd,
        description: `CDS ${pkg.name}`,
        returnUrl,
        cancelUrl,
      })
      await supabase.from('payments').update({
        external_order_id: paymentLinkId,
        metadata: { ...pkg, order_code: orderCode },
      }).eq('id', payment.id)
      return NextResponse.json({ redirect_url: checkoutUrl })
    }
  } catch (e: unknown) {
    // Clean up pending payment on gateway error
    await supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Gateway error' }, { status: 502 })
  }
}
