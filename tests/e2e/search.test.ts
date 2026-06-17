import { test, expect } from '@playwright/test'

test('/search muestra la barra de busqueda', async ({ page }) => {
  await page.goto('/search')
  await expect(page.getByPlaceholder(/buscá/i)).toBeVisible()
})

test('escribir en la barra y presionar Enter muestra resultados', async ({ page }) => {
  await page.goto('/search')
  const input = page.getByPlaceholder(/buscá/i)
  await input.fill('Elden')
  await input.press('Enter')
  await page.waitForTimeout(500)
  await expect(page.getByText('Elden Ring')).toBeVisible()
})

test('los resultados muestran el titulo de los juegos encontrados', async ({ page }) => {
  await page.goto('/search')
  const input = page.getByPlaceholder(/buscá/i)
  await input.fill('Cyberpunk')
  await input.press('Enter')
  await page.waitForTimeout(500)
  await expect(page.getByText('Cyberpunk 2077')).toBeVisible()
})

test('buscar algo inexistente muestra mensaje de sin resultados', async ({ page }) => {
  await page.goto('/search')
  const input = page.getByPlaceholder(/buscá/i)
  await input.fill('xyznonexistentgame')
  await page.waitForTimeout(500)
  await expect(page.getByText(/no encontramos juegos/i)).toBeVisible()
})

test('hacer click en un resultado navega a la pagina del juego', async ({ page }) => {
  await page.goto('/search')
  const input = page.getByPlaceholder(/buscá/i)
  await input.fill('Elden')
  await page.waitForTimeout(500)
  await page.getByText('Elden Ring').click()
  await expect(page).toHaveURL(/\/games\/elden-ring/)
})
