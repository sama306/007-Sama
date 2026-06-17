import { useStore } from '@nanostores/react';
import {
  cartItems,
  removeFromCart,
  updateQuantity,
} from '@stores/cartStore';
import { useEffect, useRef } from 'react';

export default function CartPageItems() {
  const items = useStore(cartItems);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.1 },
    );
    const cards = containerRef.current.querySelectorAll('.cart-item');
    cards.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-6 text-[var(--color-text-muted)]"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <h2 className="mb-2 text-xl font-semibold text-[var(--color-text-primary)]">
          Tu carrito está vacío
        </h2>
        <p className="mb-8 text-sm text-[var(--color-text-muted)]">
          Aún no agregaste ningún juego. Explorá el catálogo para encontrar tus títulos favoritos.
        </p>
        <a
          href="/games"
          className="btn-primary inline-block rounded-lg bg-[var(--color-accent-primary)] px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--color-accent-secondary)] hover:shadow-[0_0_20px_var(--color-accent-glow)]"
        >
          Explorar catálogo
        </a>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="cart-item reveal flex gap-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 transition-all"
        >
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg-secondary)] sm:h-28 sm:w-28">
            <img
              src={item.image}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-1 flex-col justify-between gap-2 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-[var(--color-text-primary)]">
                  {item.title}
                </h3>
                <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                  {item.platform}
                </p>
                <p className="mt-1.5 text-sm font-medium text-[var(--color-text-secondary)]">
                  ${item.price.toFixed(2)} c/u
                </p>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="shrink-0 rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-error)]"
                aria-label={`Eliminar ${item.title}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-sm text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent-primary)] hover:text-[var(--color-text-primary)]"
                >
                  -
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  min={1}
                  onChange={(e) => {
                    const val = parseInt(e.currentTarget.value, 10);
                    if (!isNaN(val)) updateQuantity(item.id, val);
                  }}
                  className="flex h-8 w-14 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-center text-sm font-medium text-[var(--color-text-primary)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-sm text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent-primary)] hover:text-[var(--color-text-primary)]"
                >
                  +
                </button>
              </div>
              <span className="text-base font-bold text-[var(--color-text-primary)]">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
