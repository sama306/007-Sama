import { useState, useCallback } from 'react'
import { addToast } from '@stores/toastStore'

interface Props {
  token: string
}

function getStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length < 4) return { label: '', color: '', width: '0%' }

  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 1) return { label: 'Débil', color: 'bg-red-500', width: '25%' }
  if (score <= 3) return { label: 'Media', color: 'bg-yellow-500', width: '60%' }
  return { label: 'Fuerte', color: 'bg-green-500', width: '100%' }
}

export default function ResetPasswordForm({ token }: Props) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  const strength = getStrength(password)

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitError('')

      const errors: Record<string, string> = {}

      if (password.length < 8) errors.password = 'Mínimo 8 caracteres.'
      else if (!/[A-Z]/.test(password)) errors.password = 'Debe contener una mayúscula.'
      else if (!/[0-9]/.test(password)) errors.password = 'Debe contener un número.'

      if (!confirmPassword) errors.confirmPassword = 'Confirmá tu contraseña.'
      else if (password !== confirmPassword)
        errors.confirmPassword = 'Las contraseñas no coinciden.'

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        return
      }

      setFieldErrors({})
      setLoading(true)

      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password, confirmPassword }),
        })

        if (res.ok) {
          addToast('success', 'Contraseña actualizada. Ya podés iniciar sesión.')
          window.location.href = '/auth/login'
          return
        }

        const data = await res.json().catch(() => ({}))

        if (data.error === 'INVALID_TOKEN') {
          setSubmitError('El link es inválido o expiró.')
          return
        }

        setSubmitError(data.message || 'Error al restablecer la contraseña.')
      } catch {
        setSubmitError('Error de conexión. Intentá de nuevo.')
      } finally {
        setLoading(false)
      }
    },
    [token, password, confirmPassword],
  )

  if (submitError) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-error)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
          Link inválido o expirado
        </h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{submitError}</p>
        <a
          href="/auth/forgot-password"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-[var(--color-accent-primary)] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--color-accent-secondary)] hover:shadow-[0_0_20px_var(--color-accent-glow)]"
        >
          Solicitar nuevo link
        </a>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]"
          >
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                clearFieldError('password')
              }}
              placeholder="••••••••"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-2.5 pr-10 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-accent-primary)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1.5 text-xs text-[var(--color-error)]">{fieldErrors.password}</p>
          )}
          {password.length > 0 && (
            <div className="mt-2">
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                Fortaleza: {strength.label || '—'}
              </p>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]"
          >
            Confirmar contraseña
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                clearFieldError('confirmPassword')
              }}
              placeholder="••••••••"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-2.5 pr-10 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-accent-primary)]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
              aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showConfirmPassword ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="mt-1.5 text-xs text-[var(--color-error)]">
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-lg bg-[var(--color-accent-primary)] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--color-accent-secondary)] hover:shadow-[0_0_20px_var(--color-accent-glow)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
        </button>
      </form>
    </div>
  )
}
