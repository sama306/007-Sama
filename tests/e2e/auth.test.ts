import { test, expect } from '@playwright/test'

test('/auth/login muestra el formulario con campos email y contrasena', async ({ page }) => {
  await page.goto('/auth/login')
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Contraseña', { exact: true })).toBeVisible()
})

test('/auth/login muestra los botones de Google y Steam', async ({ page }) => {
  await page.goto('/auth/login')
  await expect(page.getByRole('button', { name: /continuar con google/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /continuar con steam/i })).toBeVisible()
})

test('/auth/register muestra el formulario de registro', async ({ page }) => {
  await page.goto('/auth/register')
  await expect(page.getByLabel('Nombre completo')).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Contraseña', { exact: true })).toBeVisible()
})

test('login con email y contrasena incorrectos muestra error', async ({ page }) => {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Credenciales inválidas' }),
    })
  })
  await page.route('**/api/auth/forgot-password', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Si el email existe, recibirás un correo con instrucciones para restablecer tu contraseña.' }),
    })
  })
  await page.goto('/auth/login')
  await page.waitForTimeout(1500)
  await page.getByLabel('Email').fill('test@test.com')
  await page.getByLabel('Contraseña', { exact: true }).fill('wrongpassword')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page.getByText('Credenciales inválidas')).toBeVisible()
})

test('/account sin sesion redirige a /auth/login', async ({ page }) => {
  await page.goto('/account')
  await expect(page).toHaveURL(/\/auth\/login/)
})

test('/checkout sin sesion redirige a /auth/login', async ({ page }) => {
  await page.goto('/checkout')
  await expect(page).toHaveURL(/\/auth\/login/)
})

test('/auth/forgot-password muestra el formulario de recuperacion', async ({ page }) => {
  await page.goto('/auth/forgot-password')
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByRole('button', { name: /enviar instrucciones/i })).toBeVisible()
})

test('enviar el formulario de forgot-password con email valido muestra el mensaje de confirmacion', async ({ page }) => {
  await page.route('**/api/auth/forgot-password', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Si el email existe, recibirás un correo con instrucciones para restablecer tu contraseña.' }),
    })
  })
  await page.goto('/auth/forgot-password')
  await page.waitForTimeout(1500)
  await page.getByLabel('Email').fill('test@example.com')
  await page.getByRole('button', { name: /enviar instrucciones/i }).click()
  await expect(page.getByRole('heading', { name: /revisá tu email/i })).toBeVisible()
})
