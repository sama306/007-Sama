import { useStore } from '@nanostores/react'
import { toasts, removeToast, type ToastType } from '@stores/toastStore'
import type { JSX } from 'react'

const iconMap: Record<ToastType, JSX.Element> = {
  success: (
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  error: (
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
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: (
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
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
}

const borderMap: Record<ToastType, string> = {
  success: 'border-[var(--color-success)]',
  error: 'border-[var(--color-error)]',
  info: 'border-[var(--color-accent-primary)]',
}

const textMap: Record<ToastType, string> = {
  success: 'text-[var(--color-success)]',
  error: 'text-[var(--color-error)]',
  info: 'text-[var(--color-accent-neon)]',
}

function ToastItem({ id, type, message }: { id: string; type: ToastType; message: string }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`animate-fade-in-up flex items-start gap-3 rounded-xl border-l-4 ${borderMap[type]} bg-[var(--color-bg-card)] px-4 py-3 shadow-lg`}
      style={{ animation: 'fadeInUp 0.3s ease forwards' }}
    >
      <span className={`mt-0.5 shrink-0 ${textMap[type]}`}>{iconMap[type]}</span>
      <p className="flex-1 text-sm text-[var(--color-text-primary)]">{message}</p>
      <button
        onClick={() => removeToast(id)}
        className="shrink-0 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
        aria-label="Cerrar notificación"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const items = useStore(toasts)

  if (items.length === 0) return null

  const visible = items.slice(0, 3)

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-full max-w-sm flex-col gap-3">
      {visible.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem id={t.id} type={t.type} message={t.message} />
        </div>
      ))}
    </div>
  )
}
