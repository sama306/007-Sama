import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('la home carga y muestra el titulo principal del sitio', async ({ page }) => {
  await expect(page.locator('h1')).toContainText('Descubrí los mejores')
})

test('el link del header Catálogo navega a /games', async ({ page }) => {
  await page.getByRole('link', { name: 'Catálogo' }).click()
  await expect(page).toHaveURL('/games')
})

test('el link del header Noticias navega a /news', async ({ page }) => {
  await page.getByRole('link', { name: 'Noticias' }).click()
  await expect(page).toHaveURL('/news')
})

test('el link del header Novedades navega a /new-releases', async ({ page }) => {
  await page.getByRole('link', { name: 'Novedades' }).click()
  await expect(page).toHaveURL('/new-releases')
})

test('el logo navega de vuelta a /', async ({ page }) => {
  await page.goto('/games')
  await page.getByRole('link', { name: /007-Sama/ }).first().click()
  await expect(page).toHaveURL('/')
})

test('una ruta inexistente /pagina-que-no-existe muestra pagina 404', async ({ page }) => {
  const response = await page.goto('/pagina-que-no-existe', { waitUntil: 'networkidle' })
  expect(response?.status()).toBe(404)
})

test('la pagina 404 tiene un link para volver al inicio', async ({ page }) => {
  await page.goto('/pagina-que-no-existe', { waitUntil: 'networkidle' })
  await page.getByRole('link', { name: /volver al inicio/i }).click()
  await expect(page).toHaveURL('/')
})
