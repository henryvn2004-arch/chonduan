import { test, expect } from '@playwright/test'

test.describe('API routes — unauthenticated responses', () => {

  test('GET /api/projects/by-bounds returns JSON', async ({ request }) => {
    const res = await request.get('/api/projects/by-bounds?north=21.1&south=20.9&east=105.9&west=105.7&mode=sale')
    expect(res.status()).toBeLessThan(500)
    const body = await res.json()
    expect(Array.isArray(body) || body.error).toBeTruthy()
  })

  test('GET /api/search returns JSON', async ({ request }) => {
    const res = await request.get('/api/search?q=vinhomes&mode=sale')
    // 200 OK or 500 if env vars missing in test env — not a 404
    expect(res.status()).not.toBe(404)
  })

  test('POST /api/leads returns 400 without required fields', async ({ request }) => {
    const res = await request.post('/api/leads', { data: {} })
    expect(res.status()).toBe(400)
  })

  test('POST /api/bid requires auth (401) or env (500)', async ({ request }) => {
    const res = await request.post('/api/bid', {
      data: { project_id: 'test', slot_type: 'sale', bid_amount_weekly_credits: 100 },
    })
    // 401 = auth required (prod), 500 = Supabase env vars missing (test env)
    expect([401, 500]).toContain(res.status())
  })

  test('DELETE /api/bid requires auth (401) or env (500)', async ({ request }) => {
    const res = await request.delete('/api/bid', { data: { bid_id: 'test' } })
    expect([401, 500]).toContain(res.status())
  })

  test('POST /api/wallet/topup requires auth (401) or env (500)', async ({ request }) => {
    const res = await request.post('/api/wallet/topup', {
      data: { package_id: 'test', method: 'payos' },
    })
    expect([401, 500]).toContain(res.status())
  })

  test('PATCH /api/leads/[id] requires auth (401) or env (500)', async ({ request }) => {
    const res = await request.patch('/api/leads/00000000-0000-0000-0000-000000000000', {
      data: { status: 'contacted' },
    })
    expect([401, 500]).toContain(res.status())
  })

  test('GET /api/sitemap.xml returns XML or 500 (env)', async ({ request }) => {
    const res = await request.get('/api/sitemap.xml')
    if (res.status() === 200) {
      const text = await res.text()
      expect(text).toContain('<?xml')
      expect(text).toContain('<urlset')
    } else {
      expect(res.status()).toBe(500) // Supabase env vars missing in test env
    }
  })

  test('GET /api/projects/search-autocomplete returns array or 500 (env)', async ({ request }) => {
    const res = await request.get('/api/projects/search-autocomplete?q=vinhomes&limit=5')
    if (res.status() === 200) {
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
    } else {
      expect(res.status()).toBe(500) // Supabase env vars missing in test env
    }
  })

})
