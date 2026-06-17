import { test, expect } from '@playwright/test'

test('/auth/login muestra el formulario con campos email y contrasena', async ({ page }) => {
  await page.goto('/auth/login')
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Contraseña')).toBeVisible()
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
  await expect(page.getByLabel('Contraseña')).toBeVisible()
})

test('login con email y contrasena incorrectos muestra error', async ({ page }) => {
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill('test@test.com')
  await page.getByLabel('Contraseña').fill('wrongpassword')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await page.waitForTimeout(500)
  await expect(page.getByText(/email o contraseña incorrectos/i)).toBeVisible()
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
  await page.goto('/auth/forgot-password')
  await page.getByLabel('Email').fill('test@example.com')
  await page.getByRole('button', { name: /enviar instrucciones/i }).click()
  await page.waitForTimeout(500)
  await expect(page.getByText(/revisá tu email/i)).toBeVisible()
})
