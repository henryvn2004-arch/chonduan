import crypto from 'crypto'

const BASE = 'https://api-merchant.payos.vn/v2/payment-requests'

function signPayOS(data: Record<string, unknown>, checksumKey: string): string {
  // payOS signature: sort keys alphabetically, join as key=value&..., HMAC-SHA256
  const sorted = Object.keys(data)
    .sort()
    .filter(k => data[k] !== null && data[k] !== undefined && data[k] !== '')
    .map(k => `${k}=${data[k]}`)
    .join('&')
  return crypto.createHmac('sha256', checksumKey).update(sorted).digest('hex')
}

export async function createPayOSLink(params: {
  orderCode: number   // unique int, used as idempotency key
  amountVnd: number
  description: string
  returnUrl: string
  cancelUrl: string
}): Promise<{ checkoutUrl: string; paymentLinkId: string }> {
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY!
  const body = {
    orderCode: params.orderCode,
    amount: params.amountVnd,
    description: params.description.slice(0, 25), // payOS max 25 chars
    returnUrl: params.returnUrl,
    cancelUrl: params.cancelUrl,
  }
  const signature = signPayOS(body, checksumKey)

  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'x-client-id': process.env.PAYOS_CLIENT_ID!,
      'x-api-key': process.env.PAYOS_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, signature }),
  })

  const data = await res.json()
  if (data.code !== '00') throw new Error(`payOS error: ${data.desc}`)
  return {
    checkoutUrl: data.data.checkoutUrl,
    paymentLinkId: data.data.paymentLinkId,
  }
}

export function verifyPayOSWebhook(
  payload: Record<string, unknown>,
  checksumKey: string
): boolean {
  const { signature, ...data } = payload
  const expected = signPayOS(data as Record<string, unknown>, checksumKey)
  return expected === signature
}
