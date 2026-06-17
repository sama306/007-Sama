import { test, expect } from '@playwright/test'
import { clearLocalStorage } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearLocalStorage(page)
})

test('el boton de wishlist en GameCard cambia de estado al hacer click', async ({ page }) => {
  await page.goto('/games')
  await page.locator('.game-card').first().waitFor()
  await page.waitForTimeout(1000)
  await page.locator('.game-card').first().getByRole('button', { name: /agregar a favoritos/i }).click({ force: true })
  await page.waitForTimeout(500)
  await expect(page.locator('.game-card').first().getByRole('button', { name: /quitar de favoritos/i })).toBeVisible()
})

test('el boton de wishlist en detalle de juego funciona igual', async ({ page }) => {
  await page.goto('/games/elden-ring')
  await page.locator('article').getByRole('button', { name: /agregar a favoritos/i }).click()
  await page.waitForTimeout(500)
  await expect(page.locator('article').getByRole('button', { name: /quitar de favoritos/i })).toBeVisible()
})

test('/account/wishlist sin sesion redirige a login', async ({ page }) => {
  await page.goto('/account/wishlist')
  await expect(page).toHaveURL(/\/auth\/login/)
})
