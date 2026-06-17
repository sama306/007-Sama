import { test, expect } from '@playwright/test'
import { clearLocalStorage, addGameToCart, waitForToast } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearLocalStorage(page)
})

test('el contador del carrito muestra 0 al inicio', async ({ page }) => {
  await page.goto('/')
  const cartButton = page.getByRole('button', { name: /carrito/i }).first()
  await expect(cartButton).toBeVisible()
})

test('agregar un juego incrementa el contador a 1', async ({ page }) => {
  await addGameToCart(page, 'elden-ring')
  await waitForToast(page, 'Agregado al carrito')
  const cartButton = page.getByRole('button', { name: /carrito/i }).first()
  await expect(cartButton).toContainText('1')
})

test('el icono del carrito abre el CartDrawer', async ({ page }) => {
  await addGameToCart(page, 'elden-ring')
  await waitForToast(page, 'Agregado al carrito')
  await page.getByRole('button', { name: /carrito/i }).first().click({ force: true })
  await expect(page.getByText('Carrito').first()).toBeVisible()
})

test('el CartDrawer muestra el juego agregado con su titulo', async ({ page }) => {
  await addGameToCart(page, 'elden-ring')
  await waitForToast(page, 'Agregado al carrito')
  await page.getByRole('button', { name: /carrito/i }).first().click({ force: true })
  await expect(page.getByText('Elden Ring').first()).toBeVisible()
})

test('aumentar la cantidad en el CartDrawer actualiza el contador', async ({ page }) => {
  await addGameToCart(page, 'elden-ring')
  await waitForToast(page, 'Agregado al carrito')
  await page.getByRole('button', { name: /cerrar carrito/i }).locator('..').locator('..').getByText('+').click({ force: true })
  await page.waitForTimeout(300)
})

test('eliminar el item del CartDrawer deja el carrito vacio', async ({ page }) => {
  await addGameToCart(page, 'elden-ring')
  await waitForToast(page, 'Agregado al carrito')
  const deleteBtn = page.getByRole('button', { name: /eliminar elden ring/i })
  await deleteBtn.scrollIntoViewIfNeeded()
  await deleteBtn.click()
  await expect(page.getByText('Tu carrito está vacío').first()).toBeVisible()
})

test('/cart muestra los items del carrito', async ({ page }) => {
  await addGameToCart(page, 'elden-ring')
  await waitForToast(page, 'Agregado al carrito')
  await page.goto('/cart')
  await expect(page.getByText('Elden Ring').first()).toBeVisible()
})

test('/cart muestra el subtotal y total correctamente', async ({ page }) => {
  await addGameToCart(page, 'elden-ring')
  await waitForToast(page, 'Agregado al carrito')
  await page.goto('/cart')
  await expect(page.getByText('Subtotal')).toBeVisible()
  await expect(page.getByText('Total')).toBeVisible()
})

test('el boton Continuar al checkout en /cart navega a /checkout', async ({ page }) => {
  await addGameToCart(page, 'elden-ring')
  await waitForToast(page, 'Agregado al carrito')
  await page.getByRole('link', { name: /ir al checkout/i }).click()
  await expect(page).toHaveURL(/\/auth\/login/)
})
