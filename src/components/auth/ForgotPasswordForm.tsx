import { useState, useCallback } from 'react'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const validateEmail = (value: string) => {
    if (!value) return 'El email es obligatorio.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido.'
    return ''
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    if (emailError) setEmailError(validateEmail(value))
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitError('')

      const err = validateEmail(email)
      if (err) {
        setEmailError(err)
        return
      }

      setLoading(true)
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })

        if (res.status === 429) {
          const data = await res.json().catch(() => ({}))
          setSubmitError(data.message || 'Esperá 15 minutos antes de intentar de nuevo.')
          return
        }

        if (!res.ok) {
          setSubmitError('Error al procesar la solicitud. Intentá de nuevo.')
          return
        }

        setSubmitted(true)
      } catch {
        setSubmitError('Error de conexión. Intentá de nuevo.')
      } finally {
        setLoading(false)
      }
    },
    [email],
  )

  if (submitted) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success)]/10">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-success)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Revisá tu email</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Si la cuenta existe, vas a recibir un link para restablecer tu contraseña en los próximos
          minutos.
        </p>
        <a
          href="/auth/login"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-[var(--color-accent-primary)] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--color-accent-secondary)] hover:shadow-[0_0_20px_var(--color-accent-glow)]"
        >
          Volver al inicio de sesión
        </a>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
      {submitError && (
        <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-[var(--color-error)]">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="tu@email.com"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-accent-primary)]"
          />
          {emailError && <p className="mt-1.5 text-xs text-[var(--color-error)]">{emailError}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-lg bg-[var(--color-accent-primary)] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--color-accent-secondary)] hover:shadow-[0_0_20px_var(--color-accent-glow)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar instrucciones'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <a
          href="/auth/login"
          className="text-[var(--color-accent-secondary)] transition-colors hover:text-[var(--color-accent-neon)]"
        >
          Volver al inicio de sesión
        </a>
      </div>
    </div>
  )
}
