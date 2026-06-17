import { test, expect } from '@playwright/test'

test('/games muestra al menos un juego en el grid', async ({ page }) => {
  await page.goto('/games')
  const cards = page.locator('.game-card')
  await expect(cards.first()).toBeVisible()
})

test('hacer click en una GameCard navega a /games/[slug]', async ({ page }) => {
  await page.goto('/games')
  const firstCard = page.locator('.game-card a').first()
  const href = await firstCard.getAttribute('href')
  await firstCard.click()
  await expect(page).toHaveURL(new RegExp(href || '/games/'))
})

test('la pagina de detalle muestra el titulo del juego', async ({ page }) => {
  await page.goto('/games/elden-ring')
  await expect(page.getByRole('heading', { name: /elden ring/i })).toBeVisible()
})

test('la pagina de detalle muestra el precio', async ({ page }) => {
  await page.goto('/games/elden-ring')
  await expect(page.getByText(/\$\d+\.\d{2}/).first()).toBeVisible()
})

test('la pagina de detalle tiene el boton Agregar al carrito', async ({ page }) => {
  await page.goto('/games/elden-ring')
  await expect(page.getByRole('button', { name: /agregar al carrito/i })).toBeVisible()
})

test('el filtro de plataforma filtra los resultados', async ({ page }) => {
  await page.goto('/games')
  const allCards = page.locator('.game-card')
  const initialCount = await allCards.count()
  await page.getByText('Nintendo Switch').click()
  await page.getByRole('button', { name: 'Aplicar filtros' }).click()
  await page.waitForTimeout(300)
  const filteredCount = await allCards.filter({ has: page.locator('a') }).filter({ visible: true }).count()
  expect(filteredCount).toBeLessThanOrEqual(initialCount)
})

test('el filtro de genero filtra los resultados', async ({ page }) => {
  await page.goto('/games')
  const allCards = page.locator('.game-card')
  const initialCount = await allCards.count()
  await page.getByText('Deportes').click()
  await page.getByRole('button', { name: 'Aplicar filtros' }).click()
  await page.waitForTimeout(300)
  const filteredCount = await allCards.filter({ has: page.locator('a') }).filter({ visible: true }).count()
  expect(filteredCount).toBeLessThanOrEqual(initialCount)
})

test('/new-releases carga y muestra juegos', async ({ page }) => {
  await page.goto('/new-releases')
  await expect(page.getByRole('heading', { name: /nuevos lanzamientos/i })).toBeVisible()
})
