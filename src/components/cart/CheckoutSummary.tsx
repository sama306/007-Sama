import { useStore } from '@nanostores/react';
import { cartItems, cartSubtotal } from '@stores/cartStore';

const TAX_RATE = 0.21;

export default function CheckoutSummary() {
  const items = useStore(cartItems);
  const subtotal = useStore(cartSubtotal);

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return (
    <div className="sticky top-24 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
      <h2 className="mb-6 text-lg font-semibold text-[var(--color-text-primary)]">
        Resumen del pedido
      </h2>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg-secondary)]">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                {item.title}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Cant.: {item.quantity} &middot; ${item.price.toFixed(2)} c/u
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-[var(--color-text-primary)]">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <hr className="my-4 border-[var(--color-border)]" />

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-text-secondary)]">Subtotal</span>
          <span className="font-medium text-[var(--color-text-primary)]">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-text-secondary)]">IVA (21%)</span>
          <span className="font-medium text-[var(--color-text-primary)]">${tax.toFixed(2)}</span>
        </div>
      </div>

      <hr className="my-4 border-[var(--color-border)]" />

      <div className="flex items-center justify-between text-base">
        <span className="font-semibold text-[var(--color-text-primary)]">Total</span>
        <span className="text-lg font-bold text-[var(--color-accent-neon)]">${total.toFixed(2)}</span>
      </div>
    </div>
  );
}
