import { randomBytes } from 'node:crypto'

/**
 * En producción guardar tokens en DB con tabla password_reset_tokens
 * y eliminarlos automáticamente con un cron job.
 */
const resetTokens = new Map<
  string,
  {
    email: string
    expiresAt: number
    used: boolean
  }
>()

export function generateResetToken(email: string): string {
  const token = randomBytes(32).toString('hex')

  resetTokens.set(token, {
    email: email.toLowerCase(),
    expiresAt: Date.now() + 3_600_000,
    used: false,
  })

  return token
}

export function validateResetToken(token: string): { valid: boolean; email?: string } {
  const entry = resetTokens.get(token)

  if (!entry) return { valid: false }
  if (entry.used) return { valid: false }
  if (Date.now() > entry.expiresAt) {
    resetTokens.delete(token)
    return { valid: false }
  }

  return { valid: true, email: entry.email }
}

export function consumeResetToken(token: string): void {
  const entry = resetTokens.get(token)
  if (entry) {
    entry.used = true
    resetTokens.delete(token)
  }
}

export function getRateLimitCount(ip: string): number {
  return rateLimitMap.get(ip)?.count ?? 0
}

export function incrementRateLimit(ip: string): void {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now - entry.windowStart > 15 * 60 * 1000) {
    rateLimitMap.set(ip, { count: 1, windowStart: now })
  } else {
    entry.count++
  }
}

export function isRateLimited(ip: string): boolean {
  const entry = rateLimitMap.get(ip)
  if (!entry) return false
  const now = Date.now()
  if (now - entry.windowStart > 15 * 60 * 1000) {
    rateLimitMap.delete(ip)
    return false
  }
  return entry.count > 3
}

const rateLimitMap = new Map<string, { count: number; windowStart: number }>()
