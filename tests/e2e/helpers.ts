import type { Page } from '@playwright/test'

export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => localStorage.clear())
}

export async function addGameToCart(page: Page, slug: string) {
  await page.goto(`/games/${slug}`)
  await page.getByRole('button', { name: /agregar al carrito/i }).click()
  await page.waitForTimeout(500)
}

export async function waitForToast(page: Page, text: string) {
  await page.getByText(text).waitFor({ timeout: 3000 })
}
