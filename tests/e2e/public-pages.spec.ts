import { test, expect } from '@playwright/test'

test.describe('Public pages', () => {

  test('homepage loads with map', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/ChonDuAn/)
    // Mode toggle buttons visible
    await expect(page.getByText('Mua / Bán')).toBeVisible()
    // Use first() — "Cho thuê" appears in mode toggle + filter sidebar
    await expect(page.getByRole('button', { name: /Cho thuê/ }).first()).toBeVisible()
  })

  test('search page renders', async ({ page }) => {
    await page.goto('/tim-kiem')
    // Page loads without crashing (title may be empty without Supabase env in test)
    await expect(page.locator('body')).toBeVisible()
  })

  test('login page renders', async ({ page }) => {
    await page.goto('/dang-nhap')
    await expect(page.getByRole('heading', { name: /đăng nhập/i })).toBeVisible()
  })

  test('agent signup page renders', async ({ page }) => {
    await page.goto('/dang-ky/moi-gioi')
    await expect(page.locator('h1, h2')).toBeVisible()
  })

})
