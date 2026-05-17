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

export async function createPayPalOrder(params: {
  amountVnd: number
  packageName: string
  returnUrl: string
  cancelUrl: string
  internalOrderId: string
}): Promise<{ orderId: string; approveUrl: string }> {
  const token = await getAccessToken()
  // PayPal requires USD — convert at ~25,000 VND/USD
  const amountUsd = (params.amountVnd / 25000).toFixed(2)

  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': params.internalOrderId,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: params.internalOrderId,
        description: `ChonDuAn Credits — ${params.packageName}`,
        amount: { currency_code: 'USD', value: amountUsd },
      }],
      payment_source: {
        paypal: {
          experience_context: {
            return_url: params.returnUrl,
            cancel_url: params.cancelUrl,
            brand_name: 'ChonDuAn',
            locale: 'vi-VN',
            landing_page: 'LOGIN',
            user_action: 'PAY_NOW',
          },
        },
      },
    }),
  })

  const order = await res.json()
  const approveUrl = order.links?.find((l: { rel: string; href: string }) => l.rel === 'payer-action')?.href
  return { orderId: order.id, approveUrl }
}

export async function capturePayPalOrder(paypalOrderId: string): Promise<{
  captureId: string
  status: string
}> {
  const token = await getAccessToken()
  const res = await fetch(`${BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const data = await res.json()
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0]
  return { captureId: capture?.id, status: data.status }
}

export async function verifyPayPalWebhook(params: {
  headers: Record<string, string>
  rawBody: string
  webhookId: string
}): Promise<boolean> {
  const token = await getAccessToken()
  const res = await fetch(`${BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_algo: params.headers['paypal-auth-algo'],
      cert_url: params.headers['paypal-cert-url'],
      transmission_id: params.headers['paypal-transmission-id'],
      transmission_sig: params.headers['paypal-transmission-sig'],
      transmission_time: params.headers['paypal-transmission-time'],
      webhook_id: params.webhookId,
      webhook_event: JSON.parse(params.rawBody),
    }),
  })
  const data = await res.json()
  return data.verification_status === 'SUCCESS'
}
