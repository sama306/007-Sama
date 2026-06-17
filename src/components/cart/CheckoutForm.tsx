import { useStore } from '@nanostores/react';
import { cartItems, clearCart } from '@stores/cartStore';
import { useState, useCallback, useEffect } from 'react';

export default function CheckoutForm() {
  const items = useStore(cartItems);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al procesar el pago');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago');
      setLoading(false);
    }
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 text-center">
        <p className="text-[var(--color-text-muted)]">Tu carrito está vacío.</p>
        <a href="/cart" className="mt-4 inline-block rounded-lg bg-[var(--color-accent-primary)] px-6 py-3 text-sm font-semibold text-white">
          Volver al carrito
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
      <h2 className="mb-6 text-lg font-semibold text-[var(--color-text-primary)]">
        Información de contacto
      </h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
            Nombre completo
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-accent-primary)]"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-accent-primary)]"
          />
        </div>
      </div>

      <h2 className="mb-4 mt-8 text-lg font-semibold text-[var(--color-text-primary)]">
        Método de pago
      </h2>

      {error && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-[var(--color-error)]">
          {error}
        </p>
      )}

      <button
        onClick={handlePay}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#635BFF] px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-[#4f46e5] hover:shadow-[0_0_20px_rgba(99,91,255,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Redirigiendo a Stripe...
          </>
        ) : (
          <>
            <svg viewBox="0 0 50 20" className="h-6 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M41.5 0h-33C3.8 0 0 3.8 0 8.5v3C0 16.2 3.8 20 8.5 20h33c4.7 0 8.5-3.8 8.5-8.5v-3C50 3.8 46.2 0 41.5 0z" fill="#635BFF"/>
              <path d="M14 6.5h3.5v7H14v-7zm5.5 0H23l2 4.5 2-4.5h3.5v7h-3v-4.5l-2 4.5h-1l-2-4.5V13.5h-3v-7zm14.5 0h-3v7h3c2.2 0 3.5-1.5 3.5-3.5v-0c0-2-1.3-3.5-3.5-3.5zm0 4.5h0v-2h.5c.8 0 1 .5 1 .8v.4c0 .3-.2.8-1 .8h-.5z" fill="white"/>
            </svg>
            Pagar con Stripe
          </>
        )}
      </button>

      <div className="mt-4 flex items-center justify-center gap-3">
        <svg className="h-5 w-auto" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="38" height="24" rx="3" fill="#1A1F71"/>
          <path d="M12.5 7.5h-2l-2.5 6h1.5l.5-1.5h2.5l.5 1.5h1.5l-2-6zm-1.5 3.5l.8-2.5.8 2.5H11zM19 7.5h-1.5l-1.5 6h1.5l1.5-6zM22.5 7.5h-1.5l1.5 6h1.5l-1.5-6zM28.5 9.5c-.5 0-1 .2-1.3.5l-.2-.5h-1.5v6h1.5v-3.5c.3-.3.7-.5 1-.5.5 0 .8.2.8.8v3.2h1.5v-3.5c0-1.2-.8-1.5-1.8-1.5z" fill="white"/>
        </svg>
        <svg className="h-5 w-auto" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="38" height="24" rx="3" fill="#242424"/>
          <circle cx="16" cy="12" r="5" fill="#FF5F00"/>
          <ellipse cx="24" cy="12" rx="5" ry="5" fill="#F79E1B" clipRule="evenodd"/>
          <path d="M19 8.5c1.2 1.4 1.2 3.6 0 5-1.2-1.4-1.2-3.6 0-5z" fill="#EB001B"/>
        </svg>
        <svg className="h-5 w-auto" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="38" height="24" rx="3" fill="#016FD0"/>
          <path d="M22.5 10.5c-1.5 0-2.5 1-2.5 2.5s1 2.5 2.5 2.5 2.5-1 2.5-2.5-1-2.5-2.5-2.5zm0 3.8c-.8 0-1.3-.5-1.3-1.3s.5-1.3 1.3-1.3 1.3.5 1.3 1.3-.5 1.3-1.3 1.3zM14 10.5c-1.5 0-2.5 1-2.5 2.5s1 2.5 2.5 2.5 2.5-1 2.5-2.5-1-2.5-2.5-2.5zm0 3.8c-.8 0-1.3-.5-1.3-1.3s.5-1.3 1.3-1.3 1.3.5 1.3 1.3-.5 1.3-1.3 1.3z" fill="white"/>
        </svg>
      </div>

      <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
        🔒 Pago 100% seguro procesado por Stripe. Tus datos no se almacenan en este servidor.
      </p>
    </div>
  );
}
