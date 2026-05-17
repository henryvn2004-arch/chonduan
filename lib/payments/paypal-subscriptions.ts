// PayPal Subscriptions API — for recurring payments (e.g. Verified Badge $5/month)
// Docs: https://developer.paypal.com/docs/subscriptions/

const BASE = process.env.PAYPAL_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

async function getAccessToken(): Promise<string> {
  const creds = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64')
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

// Create a billing plan (call once, cache plan_id in env)
export async function createBillingPlan(params: {
  name: string
  description: string
  priceUsd: string  // e.g. "5.00"
  intervalUnit: 'MONTH' | 'YEAR'
  intervalCount?: number
}): Promise<{ planId: string }> {
  const token = await getAccessToken()

  const res = await fetch(`${BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      product_id: process.env.PAYPAL_PRODUCT_ID, // created once in PayPal dashboard
      name: params.name,
      description: params.description,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: {
            interval_unit: params.intervalUnit,
            interval_count: params.intervalCount ?? 1,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // 0 = infinite
          pricing_scheme: {
            fixed_price: { value: params.priceUsd, currency_code: 'USD' },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    }),
  })

  const data = await res.json()
  return { planId: data.id }
}

// Create a subscription for a user
export async function createSubscription(params: {
  planId: string
  returnUrl: string
  cancelUrl: string
  customId?: string  // internal reference (e.g. agent_id)
}): Promise<{ subscriptionId: string; approveUrl: string }> {
  const token = await getAccessToken()

  const res = await fetch(`${BASE}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plan_id: params.planId,
      custom_id: params.customId,
      application_context: {
        brand_name: 'PhaplyDuan',
        locale: 'vi-VN',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  })

  const data = await res.json()
  const approveUrl = data.links?.find((l: { rel: string; href: string }) => l.rel === 'approve')?.href
  return { subscriptionId: data.id, approveUrl }
}

// Get subscription details
export async function getSubscription(subscriptionId: string): Promise<{
  id: string
  status: string
  customId: string
}> {
  const token = await getAccessToken()
  const res = await fetch(`${BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  return {
    id: data.id,
    status: data.status, // APPROVAL_PENDING | APPROVED | ACTIVE | SUSPENDED | CANCELLED | EXPIRED
    customId: data.custom_id,
  }
}

// Cancel a subscription
export async function cancelSubscription(
  subscriptionId: string,
  reason: string = 'Cancelled by user'
): Promise<void> {
  const token = await getAccessToken()
  await fetch(`${BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  })
}

// Verify PayPal webhook signature (reuse same logic as one-time payments)
export async function verifySubscriptionWebhook(params: {
  headers: Record<string, string>
  rawBody: string
}): Promise<{ valid: boolean; eventType: string; subscriptionId: string; status: string }> {
  const token = await getAccessToken()
  const event = JSON.parse(params.rawBody)

  const res = await fetch(`${BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_algo: params.headers['paypal-auth-algo'],
      cert_url: params.headers['paypal-cert-url'],
      transmission_id: params.headers['paypal-transmission-id'],
      transmission_sig: params.headers['paypal-transmission-sig'],
      transmission_time: params.headers['paypal-transmission-time'],
      webhook_id: process.env.PAYPAL_SUBSCRIPTION_WEBHOOK_ID!,
      webhook_event: event,
    }),
  })

  const data = await res.json()
  return {
    valid: data.verification_status === 'SUCCESS',
    eventType: event.event_type ?? '',
    subscriptionId: event.resource?.id ?? '',
    status: event.resource?.status ?? '',
  }
}
