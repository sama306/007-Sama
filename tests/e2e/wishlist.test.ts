import { test, expect } from '@playwright/test'
import { clearLocalStorage } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearLocalStorage(page)
})

test('el boton de wishlist en GameCard cambia de estado al hacer click', async ({ page }) => {
  await page.goto('/games')
  const wishlistBtn = page.locator('.game-card').first().getByRole('button', { name: /agregar a favoritos/i })
  await expect(wishlistBtn).toBeVisible()
  await wishlistBtn.click()
  await page.waitForTimeout(500)
  await expect(wishlistBtn).toHaveAttribute('aria-label', /quitar de favoritos/i)
})

test('el boton de wishlist en detalle de juego funciona igual', async ({ page }) => {
  await page.goto('/games/elden-ring')
  const wishlistBtn = page.getByRole('button', { name: /agregar a favoritos/i })
  await expect(wishlistBtn).toBeVisible()
  await wishlistBtn.click()
  await page.waitForTimeout(500)
  await expect(wishlistBtn).toHaveAttribute('aria-label', /quitar de favoritos/i)
})

test('/account/wishlist sin sesion redirige a login', async ({ page }) => {
  await page.goto('/account/wishlist')
  await expect(page).toHaveURL(/\/auth\/login/)
})
