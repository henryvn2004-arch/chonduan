import { test, expect } from '@playwright/test'

test.describe('Auth redirects (unauthenticated)', () => {

  test('agent dashboard redirects to login', async ({ page }) => {
    await page.goto('/dashboard/moi-gioi')
    await expect(page).toHaveURL(/dang-nhap/)
  })

  test('bid page redirects to login', async ({ page }) => {
    await page.goto('/dashboard/moi-gioi/bid')
    await expect(page).toHaveURL(/dang-nhap/)
  })

  test('nap-tien page redirects to login', async ({ page }) => {
    await page.goto('/dashboard/moi-gioi/nap-tien')
    await expect(page).toHaveURL(/dang-nhap/)
  })

  test('admin dashboard redirects', async ({ page }) => {
    await page.goto('/dashboard/admin')
    // Should redirect away (to login or home)
    await expect(page).not.toHaveURL('/dashboard/admin')
  })

})
