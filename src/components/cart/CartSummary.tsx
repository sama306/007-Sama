import { useStore } from '@nanostores/react';
import { cartItems, cartSubtotal } from '@stores/cartStore';
import { useState, useCallback } from 'react';

const TAX_RATE = 0.21;
const VALID_COUPON = 'PORTFOLIO2026';
const DISCOUNT_RATE = 0.1;

export default function CartSummary() {
  const items = useStore(cartItems);
  const subtotal = useStore(cartSubtotal);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = useCallback(async () => {
    setCheckingOut(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al procesar el checkout');
      window.location.href = data.url;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al procesar el checkout');
      setCheckingOut(false);
    }
  }, [items]);

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax - discount;

  const handleApplyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (!code) {
      setCouponError('Ingresá un código');
      return;
    }
    if (code === VALID_COUPON) {
      setDiscount(subtotal * DISCOUNT_RATE);
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponError('Código inválido');
      setDiscount(0);
      setCouponApplied(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="sticky top-24 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
      <h2 className="mb-6 text-lg font-semibold text-[var(--color-text-primary)]">
        Resumen del pedido
      </h2>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-text-secondary)]">Subtotal</span>
          <span className="font-medium text-[var(--color-text-primary)]">
            ${subtotal.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[var(--color-text-secondary)]">IVA (21%)</span>
          <span className="font-medium text-[var(--color-text-primary)]">
            ${tax.toFixed(2)}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between text-[var(--color-success)]">
            <span>Descuento ({VALID_COUPON})</span>
            <span className="font-medium">-${discount.toFixed(2)}</span>
          </div>
        )}

        <hr className="border-[var(--color-border)]" />

        <div className="flex items-center justify-between text-base">
          <span className="font-semibold text-[var(--color-text-primary)]">Total</span>
          <span className="text-lg font-bold text-[var(--color-accent-neon)]">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={coupon}
            onChange={(e) => {
              setCoupon(e.target.value);
              setCouponError('');
            }}
            placeholder="Código de descuento"
            className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-accent-primary)]"
          />
          <button
            onClick={handleApplyCoupon}
            disabled={couponApplied}
            className="rounded-lg bg-[var(--color-accent-primary)] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--color-accent-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Aplicar
          </button>
        </div>
        {couponError && (
          <p className="text-xs text-[var(--color-error)]">{couponError}</p>
        )}
        {couponApplied && (
          <p className="text-xs text-[var(--color-success)]">¡Código aplicado! 10% de descuento.</p>
        )}
      </div>

      <button
        onClick={handleCheckout}
        disabled={checkingOut}
        className="btn-primary mt-6 flex w-full items-center justify-center rounded-lg bg-[var(--color-accent-primary)] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--color-accent-secondary)] hover:shadow-[0_0_20px_var(--color-accent-glow)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {checkingOut ? 'Procesando...' : 'Continuar al checkout'}
      </button>

      <a
        href="/games"
        className="mt-3 flex w-full items-center justify-center rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-border-accent)] hover:text-[var(--color-text-primary)]"
      >
        Seguir comprando
      </a>

      <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
        🔒 Pago seguro con Stripe
      </p>
    </div>
  );
}
