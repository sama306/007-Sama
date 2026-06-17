import { signIn } from 'auth-astro/client'
import { useState, useCallback } from 'react'
import { addToast } from '@stores/toastStore'

interface Props {
  redirect: string
  error: string
}

const errorMessages: Record<string, string> = {
  OAuthAccountNotLinked: 'Este email ya está registrado con otro método.',
  CredentialsSignin: 'Email o contraseña incorrectos.',
  Default: 'Ocurrió un error. Intentá de nuevo.',
}

export default function LoginForm({ redirect, error }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const authError = error ? errorMessages[error] || errorMessages.Default : ''

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

  const handleOAuthSignIn = useCallback(
    (provider: string) => {
      signIn(provider, { callbackUrl: redirect })
    },
    [redirect],
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitError('')

      const err = validateEmail(email)
      if (err) {
        setEmailError(err)
        return
      }
      if (!password) {
        setSubmitError('La contraseña es obligatoria.')
        return
      }

      setLoading(true)
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setSubmitError(data.error || 'Email o contraseña incorrectos.')
          return
        }

        addToast('success', 'Bienvenido de vuelta')
        window.location.href = redirect
      } catch {
        setSubmitError('Error de conexión. Intentá de nuevo.')
      } finally {
        setLoading(false)
      }
    },
    [email, password, redirect],
  )

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
      {(authError || submitError) && (
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
          <span>{authError || submitError}</span>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={() => handleOAuthSignIn('google')}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-all hover:bg-gray-100"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continuar con Google
        </button>

        <a
          href="/api/auth/steam"
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#1b2838] px-4 py-3 text-sm font-medium text-white transition-all hover:bg-[#2a3f5a]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10c0-5.52-4.48-10-10-10zm-2.47 15.41l-1.78-2.14c-.24.08-.5.12-.77.12-1.27 0-2.3-1.03-2.3-2.3s1.03-2.3 2.3-2.3 2.3 1.03 2.3 2.3c0 .28-.05.55-.14.8l1.78 2.14c.14.17.12.42-.05.56-.16.13-.4.12-.54-.05l-.02-.02zm5.24-2.95c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3zm0-5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
          Continuar con Steam
        </a>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--color-border)]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[var(--color-bg-card)] px-3 text-[var(--color-text-muted)]">o</span>
        </div>
      </div>

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

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]"
          >
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-lg bg-[var(--color-accent-primary)] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--color-accent-secondary)] hover:shadow-[0_0_20px_var(--color-accent-glow)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm">
        <a
          href="/auth/forgot-password"
          className="block text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent-secondary)]"
        >
          ¿Olvidaste tu contraseña?
        </a>
        <a
          href="/auth/register"
          className="block text-[var(--color-accent-secondary)] transition-colors hover:text-[var(--color-accent-neon)]"
        >
          ¿No tenés cuenta? Registrate
        </a>
      </div>
    </div>
  )
}
