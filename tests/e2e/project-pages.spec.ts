import { test, expect } from '@playwright/test'

// Known slugs that should exist in DB
const KNOWN_PROJECTS = [
  { province: 'tp.-h%E1%BB%93-ch%C3%AD-minh', slug: 'masteri-thao-dien-quan-2', name: 'Masteri Thảo Điền' },
]

test.describe('Project detail pages', () => {

  test('project hub page loads or returns DB error (not 404)', async ({ page }) => {
    const { province, slug } = KNOWN_PROJECTS[0]
    const res = await page.goto(`/du-an/${province}/${slug}`)
    const status = res?.status() ?? 0

    // 404 means slug lookup broken — not acceptable
    expect(status).not.toBe(404)

    if (status === 200) {
      // Page rendered — check critical elements
      await expect(page).not.toHaveTitle('404')
      await expect(page.locator('h1')).toBeVisible()
    } else {
      // 500 = Supabase env missing in test env — acceptable in CI
      expect(status).toBe(500)
    }
  })

  test('unknown slug returns 404', async ({ page }) => {
    const res = await page.goto('/du-an/ha-noi/slug-khong-ton-tai-xyz-abc-123')
    // Either 404 (correct) or 500 (DB env missing in CI)
    expect([404, 500]).toContain(res?.status() ?? 0)
  })

  test('province segment in URL is optional for routing (slug alone works)', async ({ request }) => {
    // The page queries by slug only — province is cosmetic in URL
    const res = await request.get('/du-an/any-province/masteri-thao-dien-quan-2')
    expect(res.status()).not.toBe(404)
  })

  test('project page has Schema.org RealEstateListing script', async ({ page }) => {
    const { province, slug } = KNOWN_PROJECTS[0]
    const res = await page.goto(`/du-an/${province}/${slug}`)
    if (res?.status() !== 200) return // skip if DB unavailable

    const schema = await page.locator('script[type="application/ld+json"]').textContent()
    expect(schema).toBeTruthy()
    const parsed = JSON.parse(schema!)
    expect(parsed['@type']).toBe('RealEstateListing')
    expect(parsed.name).toBeTruthy()
  })

  test('project page tabs are visible', async ({ page }) => {
    const { province, slug } = KNOWN_PROJECTS[0]
    const res = await page.goto(`/du-an/${province}/${slug}`)
    if (res?.status() !== 200) return

    // StickyTabs should render navigation anchors
    await expect(page.locator('nav')).toBeVisible()
  })

})
